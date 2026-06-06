import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { QueryRunner } from "typeorm";
import { AppDataSource } from "../../db/data-source";
import { Chat } from "../../db/entities/Chat";
import { City } from "../../db/entities/City";
import { DoctorDetails } from "../../db/entities/DoctorDetails";
import { Hospital } from "../../db/entities/Hospital";
import { PatientDetails } from "../../db/entities/PatientDetails";
import { User } from "../../db/entities/User";
import {
  DoctorPayload,
  DoctorUpdatePayload,
  IUser,
  UserRole,
} from "../../db/interfaces/IUser";
import { Utils } from "../../utils/utils";
import { AuthTokens, UserService } from "../user/User.service";
import {
  DoctorByHospitalItem,
  DoctorListItem,
  DoctorListRawItem,
  PatientListItem,
} from "./interfaces";

const userRepo = AppDataSource.getRepository(User);
const cityRepo = AppDataSource.getRepository(City);
const hospitalRepo = AppDataSource.getRepository(Hospital);
const doctorDetailsRepo = AppDataSource.getRepository(DoctorDetails);
const chatRepo = AppDataSource.getRepository(Chat);

export class DoctorService {
  private static async findOrCreateCity(
    cityName: string,
    queryRunner?: QueryRunner
  ): Promise<City> {
    const targetCityRepo = queryRunner
      ? queryRunner.manager.getRepository(City)
      : cityRepo;
    const normalizedCityName = Utils.normalizeCityName(cityName);
    let city = await targetCityRepo.findOne({
      where: { name: normalizedCityName },
    });

    if (!city) {
      city = await targetCityRepo.save(
        targetCityRepo.create({
          name: normalizedCityName,
        })
      );
    }

    return city;
  }

  private static async findOrCreateHospital(
    hospitalNameValue: string,
    hospitalAddressValue: string,
    queryRunner?: QueryRunner
  ): Promise<Hospital> {
    const targetHospitalRepo = queryRunner
      ? queryRunner.manager.getRepository(Hospital)
      : hospitalRepo;
    const hospitalName = hospitalNameValue.trim();
    const hospitalAddress = hospitalAddressValue.trim();
    let hospital = await targetHospitalRepo.findOne({
      where: {
        name: hospitalName,
      },
    });

    if (!hospital) {
      hospital = await targetHospitalRepo.save(
        targetHospitalRepo.create({
          name: hospitalName,
          address: hospitalAddress,
        })
      );
    }

    return hospital;
  }

  public static async setPassword(
    token: string,
    password: string
  ): Promise<AuthTokens> {
    let jwtPayload: jwt.JwtPayload;

    try {
      jwtPayload = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as jwt.JwtPayload;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }

    const { id, email } = jwtPayload;
    if (typeof id !== "number" || typeof email !== "string" || !email.trim()) {
      throw new Error("Invalid token payload");
    }

    const user = await userRepo.findOne({ where: { id, email } });
    if (!user) {
      throw new Error("User not found");
    }

    user.password = await bcrypt.hash(password, 12);
    await userRepo.save(user);

    return UserService.createAuthTokens(user.id);
  }

  public static async createDoctor(
    doctorPayload: DoctorPayload,
    queryRunner?: QueryRunner
  ): Promise<User> {
    const targetRepo = queryRunner
      ? queryRunner.manager.getRepository(User)
      : userRepo;

    const doctorData: Omit<IUser, "id"> = {
      firstName: doctorPayload.firstName,
      lastName: doctorPayload.lastName,
      middleName: doctorPayload.middleName,
      email: doctorPayload.email,
      isEmailVerified: true,
      role: UserRole.DOCTOR,
      password: null,
    };

    const newDoctor = targetRepo.create(doctorData);
    return targetRepo.save(newDoctor);
  }

  public static async createDoctorDetails(
    doctorId: number,
    doctorData: DoctorPayload,
    queryRunner?: QueryRunner
  ): Promise<DoctorDetails> {
    const targetDoctorDetailsRepo = queryRunner
      ? queryRunner.manager.getRepository(DoctorDetails)
      : doctorDetailsRepo;

    const city = await this.findOrCreateCity(doctorData.city, queryRunner);
    const hospital = await this.findOrCreateHospital(
      doctorData.hospitalName,
      doctorData.hospitalAddress,
      queryRunner
    );

    const details = targetDoctorDetailsRepo.create({
      userId: doctorId,
      specialty: doctorData.specialty,
      cityId: city.id,
      hospitalId: hospital.id,
      isActive: true,
    });

    return targetDoctorDetailsRepo.save(details);
  }

  public static async updateDoctor(
    doctorId: number,
    doctorData: DoctorUpdatePayload,
    queryRunner?: QueryRunner
  ): Promise<DoctorListItem> {
    const targetUserRepo = queryRunner
      ? queryRunner.manager.getRepository(User)
      : userRepo;
    const targetDoctorDetailsRepo = queryRunner
      ? queryRunner.manager.getRepository(DoctorDetails)
      : doctorDetailsRepo;

    const doctor = await targetUserRepo.findOne({
      where: { id: doctorId, role: UserRole.DOCTOR },
    });
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    const doctorDetails = await targetDoctorDetailsRepo.findOne({
      where: { userId: doctorId },
    });
    if (!doctorDetails) {
      throw new Error("Doctor details not found");
    }

    const city = await this.findOrCreateCity(doctorData.city, queryRunner);
    const hospital = await this.findOrCreateHospital(
      doctorData.hospitalName,
      doctorData.hospitalAddress,
      queryRunner
    );

    doctor.firstName = doctorData.firstName.trim();
    doctor.lastName = doctorData.lastName.trim();
    doctor.middleName = doctorData.middleName
      ? doctorData.middleName.trim()
      : null;

    doctorDetails.specialty = doctorData.specialty.trim();
    doctorDetails.cityId = city.id;
    doctorDetails.hospitalId = hospital.id;
    doctorDetails.isActive = doctorData.isActive;

    await targetUserRepo.save(doctor);
    await targetDoctorDetailsRepo.save(doctorDetails);

    return {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      middleName: doctor.middleName,
      email: doctor.email,
      specialty: doctorDetails.specialty,
      isActive: doctorDetails.isActive,
      hospitalName: hospital.name,
      hospitalAddress: hospital.address,
      city: city.name,
    };
  }

  public static async getDoctors(
    pageNumber: number,
    pageSize: number
  ): Promise<DoctorListItem[]> {
    const offset = (pageNumber - 1) * pageSize;
    const doctors = await userRepo
      .createQueryBuilder("user")
      .leftJoin(
        DoctorDetails,
        "doctorDetails",
        "doctorDetails.userId = user.id"
      )
      .leftJoin(Hospital, "hospital", "hospital.id = doctorDetails.hospitalId")
      .leftJoin(City, "city", "city.id = doctorDetails.cityId")
      .select([
        "user.id AS id",
        "user.firstName AS firstName",
        "user.lastName AS lastName",
        "user.middleName AS middleName",
        "user.email AS email",
        "doctorDetails.specialty AS specialty",
        "doctorDetails.isActive AS isActive",
        "hospital.name AS hospitalName",
        "hospital.address AS hospitalAddress",
        "city.name AS city",
      ])
      .where("user.role = :role", { role: UserRole.DOCTOR })
      .orderBy("user.id", "DESC")
      .limit(pageSize)
      .offset(offset)
      .getRawMany<DoctorListRawItem>();

    return doctors.map(doctor => ({
      ...doctor,
      isActive: Boolean(doctor.isActive),
    }));
  }

  public static async getActiveDoctorsByHospitalId(
    hospitalId: number
  ): Promise<DoctorByHospitalItem[]> {
    return doctorDetailsRepo
      .createQueryBuilder("doctorDetails")
      .innerJoin(User, "user", "user.id = doctorDetails.userId")
      .select([
        "doctorDetails.userId AS id",
        "user.firstName AS firstName",
        "user.lastName AS lastName",
        "user.middleName AS middleName",
        "doctorDetails.specialty AS specialty",
      ])
      .where("doctorDetails.hospitalId = :hospitalId", { hospitalId })
      .andWhere("doctorDetails.isActive = :isActive", { isActive: true })
      .orderBy("doctorDetails.userId", "ASC")
      .getRawMany<DoctorByHospitalItem>();
  }

  public static async countDoctors(): Promise<number> {
    return userRepo
      .createQueryBuilder("user")
      .where("user.role = :role", { role: UserRole.DOCTOR })
      .getCount();
  }

  public static async getPatients(
    doctorId: number,
    pageNumber: number,
    pageSize: number
  ): Promise<PatientListItem[]> {
    const offset = (pageNumber - 1) * pageSize;

    return chatRepo
      .createQueryBuilder("chat")
      .select([
        "chat.patientId AS id",
        "MAX(chat.createdAt) AS date",
        "user.firstName AS firstName",
        "user.lastName AS lastName",
        "user.middleName AS middleName",
        "pd.address AS address",
        "pd.phoneNumber AS phoneNumber",
      ])
      .innerJoin(User, "user", "user.id = chat.patientId")
      .innerJoin(PatientDetails, "pd", "pd.userId = chat.patientId")
      .where("chat.doctorId = :doctorId", { doctorId })
      .andWhere("chat.isFinished = :isFinished", { isFinished: true })
      .groupBy("chat.patientId")
      .orderBy("MAX(chat.createdAt)", "DESC")
      .limit(pageSize)
      .offset(offset)
      .getRawMany<PatientListItem>();
  }

  public static async countPatients(doctorId: number): Promise<number> {
    const result = await chatRepo
      .createQueryBuilder("chat")
      .select("COUNT(DISTINCT chat.patientId)", "count")
      .where("chat.doctorId = :doctorId", { doctorId })
      .andWhere("chat.isFinished = :isFinished", { isFinished: true })
      .getRawOne<{ count: string }>();

    return result ? parseInt(result.count, 10) : 0;
  }
}

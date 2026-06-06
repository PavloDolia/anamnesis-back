import { DoctorPayload, DoctorUpdatePayload } from "../db/interfaces/IUser";
import DBService from "../db/dbService";
import { DoctorService } from "../services/doctor/Doctor.service";
import { Utils } from "../utils/utils";
import { EmailService } from "../services/email/Emai.service";
import { AuthTokens } from "../services/user/User.service";
import {
  DoctorByHospitalItem,
  DoctorListItem,
  GetDoctorsResponse,
  GetPatientsResponse,
} from "../services/doctor/interfaces";

export class DoctorController {
  public static async createDoctor(doctorData: DoctorPayload) {
    const queryRunner = await DBService.startTransaction();

    try {
      const doctor = await DoctorService.createDoctor(doctorData, queryRunner);
      await DoctorService.createDoctorDetails(
        doctor.id,
        doctorData,
        queryRunner
      );
      const emailToken = Utils.generateJwtToken({
        id: doctor.id,
        email: doctor.email,
      });
      await EmailService.sendSetPasswordEmail({
        to: doctor.email,
        token: emailToken,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        middleName: doctor.middleName,
      });
      await DBService.commitTransaction(queryRunner);
      return doctor;
    } catch (error) {
      await DBService.rollbackTransaction(queryRunner);
      throw error;
    }
  }

  public static async setPassword(
    token: string,
    password: string
  ): Promise<AuthTokens> {
    return DoctorService.setPassword(token, password);
  }

  public static async getDoctors(
    pageNumber: number,
    pageSize: number
  ): Promise<GetDoctorsResponse> {
    const doctors = await DoctorService.getDoctors(pageNumber, pageSize);
    const doctorsCount = await DoctorService.countDoctors();

    return { doctors, pagesCount: Math.ceil(doctorsCount / pageSize) };
  }

  public static async updateDoctor(
    doctorId: number,
    doctorData: DoctorUpdatePayload
  ): Promise<DoctorListItem> {
    const queryRunner = await DBService.startTransaction();

    try {
      const updatedDoctor = await DoctorService.updateDoctor(
        doctorId,
        doctorData,
        queryRunner
      );

      await DBService.commitTransaction(queryRunner);
      return updatedDoctor;
    } catch (error) {
      await DBService.rollbackTransaction(queryRunner);
      throw error;
    }
  }

  public static async getDoctorsByHospitalId(
    hospitalId: number
  ): Promise<DoctorByHospitalItem[]> {
    return DoctorService.getActiveDoctorsByHospitalId(hospitalId);
  }

  public static async getPatients(
    doctorId: number,
    pageNumber: number,
    pageSize: number
  ): Promise<GetPatientsResponse> {
    const [patients, count] = await Promise.all([
      DoctorService.getPatients(doctorId, pageNumber, pageSize),
      DoctorService.countPatients(doctorId),
    ]);
    return { patients, pagesCount: Math.ceil(count / pageSize) };
  }
}

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { LessThan, QueryRunner } from "typeorm";
import { AppDataSource } from "../../db/data-source";
import { InvalidJwtToken } from "../../db/entities/InvalidJwtToken";
import { PatientDiseaseXref } from "../../db/entities/PatientDiseaseXref";
import { PatientDetails } from "../../db/entities/PatientDetails";
import { User } from "../../db/entities/User";
import {
  IUser,
  UserLoginPayload,
  PatientPayload,
  UserProfile,
  UserRole,
  Sex,
  AdminPayload,
} from "../../db/interfaces/IUser";
import { Utils } from "../../utils/utils";
import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "./constants";

const userRepo = AppDataSource.getRepository(User);
const patientDetailsRepo = AppDataSource.getRepository(PatientDetails);
const patientDiseaseXrefRepo = AppDataSource.getRepository(PatientDiseaseXref);
const invalidJwtTokenRepo = AppDataSource.getRepository(InvalidJwtToken);

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export class UserService {
  public static async createPatientUser(
    user: PatientPayload,
    queryRunner?: QueryRunner
  ): Promise<User> {
    const userData: Omit<IUser, "id"> = {
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName,
      email: user.email,
      isEmailVerified: false,
      password: await bcrypt.hash(user.password, 12),
      role: UserRole.PATIENT,
    };
    const targetRepo = queryRunner
      ? queryRunner.manager.getRepository(User)
      : userRepo;
    const newUser = targetRepo.create(userData);
    const createdUser = await targetRepo.save(newUser);
    return createdUser;
  }

  public static async createPatientDetails(
    userId: number,
    patient: PatientPayload,
    queryRunner?: QueryRunner
  ): Promise<PatientDetails> {
    const targetRepo = queryRunner
      ? queryRunner.manager.getRepository(PatientDetails)
      : patientDetailsRepo;

    const details: PatientDetails = targetRepo.create({
      userId,
      phoneNumber: patient.phoneNumber,
      address: patient.address,
      birthDate: new Date(patient.birthDate),
      sex: patient.sex as Sex,
      weight: patient.weight ?? null,
      height: patient.height ?? null,
      dailyMedication: patient.dailyMedication ?? null,
    });
    const createdDetails = await targetRepo.save(details);
    return createdDetails;
  }

  public static async createPatientDiseases(
    userId: number,
    chronicDiseases?: string[],
    queryRunner?: QueryRunner
  ): Promise<PatientDiseaseXref[]> {
    if (!chronicDiseases?.length) {
      return [];
    }

    const normalizedDiseases = Array.from(
      new Set(chronicDiseases.map(disease => disease.trim()).filter(Boolean))
    );

    if (!normalizedDiseases.length) {
      return [];
    }

    const targetRepo = queryRunner
      ? queryRunner.manager.getRepository(PatientDiseaseXref)
      : patientDiseaseXrefRepo;

    const diseaseRows = normalizedDiseases.map(disease =>
      targetRepo.create({
        userId,
        disease,
      })
    );

    return targetRepo.save(diseaseRows);
  }

  public static createAuthTokens(userId: number): AuthTokens {
    return {
      accessToken: Utils.generateJwtToken(
        { id: userId, tokenType: "access" },
        ACCESS_TOKEN_EXPIRES_IN
      ),
      refreshToken: Utils.generateJwtToken(
        { id: userId, tokenType: "refresh" },
        REFRESH_TOKEN_EXPIRES_IN
      ),
    };
  }

  public static async loginUser(
    credentials: UserLoginPayload
  ): Promise<AuthTokens | null> {
    const { email, password } = credentials;

    if (!email || !password) {
      return null;
    }

    const user = await userRepo.findOne({ where: { email } });
    if (!user?.password) {
      return null;
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return null;
    }

    return this.createAuthTokens(user.id);
  }

  public static async refreshUserTokens(
    refreshToken: string,
    accessToken: string
  ): Promise<AuthTokens | null> {
    if (!refreshToken) {
      return null;
    }

    const isRevokedRefreshToken = await this.isTokenInvalid(refreshToken);
    if (isRevokedRefreshToken) {
      return null;
    }

    try {
      const jwtPayload = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET as string
      ) as jwt.JwtPayload;

      const { id, tokenType } = jwtPayload;
      if (typeof id !== "number" || tokenType !== "refresh") {
        return null;
      }

      await this.revokeToken(refreshToken);
      await this.revokeToken(accessToken);
      return this.createAuthTokens(id);
    } catch (error) {
      return null;
    }
  }

  public static async revokeToken(token: string): Promise<void> {
    if (!token) {
      return;
    }

    const expirationDate = this.extractTokenExpirationDate(token);
    if (!expirationDate || expirationDate <= new Date()) {
      return;
    }

    const existingToken = await invalidJwtTokenRepo.findOne({
      where: { token },
    });

    if (existingToken) {
      return;
    }

    await invalidJwtTokenRepo.save(
      invalidJwtTokenRepo.create({
        token,
        expirationDate,
      })
    );
  }

  public static async isTokenInvalid(token: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    const invalidToken = await invalidJwtTokenRepo.findOne({
      where: { token },
    });
    return Boolean(invalidToken);
  }

  public static async deleteExpiredInvalidTokens(): Promise<number> {
    const deleteResult = await invalidJwtTokenRepo.delete({
      expirationDate: LessThan(new Date()),
    });

    return deleteResult.affected ?? 0;
  }

  private static extractTokenExpirationDate(token: string): Date | null {
    const decodedToken = jwt.decode(token);
    if (!decodedToken || typeof decodedToken === "string") {
      return null;
    }

    const expirationTimestamp = decodedToken.exp;
    if (typeof expirationTimestamp !== "number") {
      return null;
    }

    return new Date(expirationTimestamp * 1000);
  }

  public static async verifyEmail(token: string): Promise<void> {
    const jwtPayload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as jwt.JwtPayload;

    const { id, email } = jwtPayload;
    const user = await userRepo.findOne({ where: { id, email } });
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await userRepo.save(user);
    }
  }

  public static async getProfile(id: number): Promise<UserProfile> {
    const userProfile = await userRepo
      .createQueryBuilder("user")
      .select([
        "user.id AS id",
        "user.firstName AS firstName",
        "user.lastName AS lastName",
        "user.middleName AS middleName",
        "user.email AS email",
        "user.isEmailVerified AS isEmailVerified",
        "user.role AS role",
      ])
      .where("user.id = :id", { id })
      .getRawOne();

    if (!userProfile) {
      throw new Error("User not found");
    }

    return userProfile;
  }

  public static async createAdminUser(
    userData: AdminPayload,
    queryRunner?: QueryRunner
  ): Promise<User> {
    const targetRepo = queryRunner
      ? queryRunner.manager.getRepository(User)
      : userRepo;
    const newUser = targetRepo.create({
      ...userData,
      password: await bcrypt.hash(userData.password, 12),
      role: UserRole.ADMIN,
      isEmailVerified: true,
    });
    const createdUser = await targetRepo.save(newUser);
    return createdUser;
  }
}

import {
  UserLoginPayload,
  PatientPayload,
  AdminPayload,
} from "../db/interfaces/IUser";
import DBService from "../db/dbService";
import { UserService } from "../services/user/User.service";
import { EmailService } from "../services/email/Emai.service";
import { Utils } from "../utils/utils";

export class UserController {
  public static async createAdminUser(userData: AdminPayload) {
    const queryRunner = await DBService.startTransaction();

    try {
      const user = await UserService.createAdminUser(userData, queryRunner);
      await DBService.commitTransaction(queryRunner);
      return user;
    } catch (error) {
      await DBService.rollbackTransaction(queryRunner);
      throw error;
    }
  }

  public static async createPatientUser(userData: PatientPayload) {
    const queryRunner = await DBService.startTransaction();

    try {
      const user = await UserService.createPatientUser(userData, queryRunner);
      await UserService.createPatientDetails(user.id, userData, queryRunner);
      await UserService.createPatientDiseases(
        user.id,
        userData.chronicDiseases,
        queryRunner
      );
      const emailToken = Utils.generateJwtToken({
        id: user.id,
        email: user.email,
      });
      await EmailService.sendVerificationEmail({
        to: user.email,
        token: emailToken,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
      });
      await DBService.commitTransaction(queryRunner);
      const tokens = UserService.createAuthTokens(user.id);
      return { user, ...tokens };
    } catch (error) {
      await DBService.rollbackTransaction(queryRunner);
      throw error;
    }
  }

  public static async loginUser(credentials: UserLoginPayload) {
    return UserService.loginUser(credentials);
  }

  public static async verifyEmail(token: string): Promise<void> {
    await UserService.verifyEmail(token);
  }

  public static async refreshUserToken(
    refreshToken: string,
    accessToken: string
  ) {
    return UserService.refreshUserTokens(refreshToken, accessToken);
  }

  public static async logoutUser(tokens: string[]): Promise<void> {
    await Promise.all(tokens.map(token => UserService.revokeToken(token)));
  }
}

import jwt, { SignOptions } from "jsonwebtoken";
import { UserService } from "../services/user/User.service";

const INVALID_JWT_TOKENS_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

export class Utils {
  public static normalizeCityName(cityName: string): string {
    return cityName
      .trim()
      .split(/\s+/)
      .map(
        part => part.charAt(0).toUpperCase() + part.slice(1).toLocaleLowerCase()
      )
      .join(" ");
  }

  public static generateJwtToken(
    payload: Record<string, any>,
    expiresIn?: SignOptions["expiresIn"]
  ): string {
    return jwt.sign(payload, process.env.JWT_SECRET as string, {
      algorithm: "HS256",
      ...(expiresIn ? { expiresIn } : {}),
    });
  }

  public static startInvalidJwtTokensCleanup() {
    setInterval(async () => {
      try {
        const deletedTokensCount =
          await UserService.deleteExpiredInvalidTokens();
        if (deletedTokensCount > 0) {
          console.log(
            `Deleted ${deletedTokensCount} expired rows from invalid_jwt_tokens`
          );
        }
      } catch (error) {
        console.error(
          "Failed to delete expired rows from invalid_jwt_tokens",
          error
        );
      }
    }, INVALID_JWT_TOKENS_CLEANUP_INTERVAL_MS);
  }

  public static parsePositiveInteger(value: unknown): number | null {
    if (typeof value !== "string") {
      return null;
    }

    const parsedValue = Number.parseInt(value, 10);
    if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
      return null;
    }

    return parsedValue;
  }

  public static isNonEmptyString(value: unknown): boolean {
    return typeof value === "string" && Boolean(value.trim());
  }

  public static isDoctorUpdatePayload(payload: unknown) {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    const doctorData = payload as Record<string, unknown>;
    const isMiddleNameValid =
      doctorData.middleName === null ||
      Utils.isNonEmptyString(doctorData.middleName);

    return (
      Utils.isNonEmptyString(doctorData.firstName) &&
      Utils.isNonEmptyString(doctorData.lastName) &&
      isMiddleNameValid &&
      Utils.isNonEmptyString(doctorData.specialty) &&
      Utils.isNonEmptyString(doctorData.city) &&
      Utils.isNonEmptyString(doctorData.hospitalName) &&
      Utils.isNonEmptyString(doctorData.hospitalAddress) &&
      typeof doctorData.isActive === "boolean"
    );
  }
}

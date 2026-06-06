import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/user/User.service";

const UNAUTHORIZED_RESPONSE = { error: "Unauthorized" };

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.Authorization as string | undefined;
    if (!token) {
      res.status(401).json(UNAUTHORIZED_RESPONSE);
      return;
    }

    const isRevokedToken = await UserService.isTokenInvalid(token);
    if (isRevokedToken) {
      res.status(401).json(UNAUTHORIZED_RESPONSE);
      return;
    }

    const jwtPayload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as jwt.JwtPayload;

    if (typeof jwtPayload.id !== "number" || jwtPayload.tokenType !== "access") {
      res.status(401).json(UNAUTHORIZED_RESPONSE);
      return;
    }

    const profile = await UserService.getProfile(jwtPayload.id);
    res.locals.user = profile;
    next();
  } catch (error) {
    res.status(401).json(UNAUTHORIZED_RESPONSE);
  }
};

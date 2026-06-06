import { NextFunction, Request, Response } from "express";
import { UserRole } from "../db/interfaces/IUser";

export const roleMiddleware =
  (role: UserRole) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = res.locals.user as { role?: UserRole } | undefined;

    if (user?.role === role) {
      next();
      return;
    }

    res.status(403).json({ error: "Forbidden" });
  };

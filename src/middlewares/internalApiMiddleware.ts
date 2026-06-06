import { NextFunction, Request, Response } from "express";

export const internalApiMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.header("internalApiKey") !== process.env.INTERNAL_API_KEY) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  next();
};

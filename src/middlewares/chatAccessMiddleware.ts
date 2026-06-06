import { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../db/data-source";
import { Chat } from "../db/entities/Chat";

const chatRepo = AppDataSource.getRepository(Chat);

export const chatAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = res.locals.user as { id?: number } | undefined;

  if (!user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const chatId = Number(req.params.chatId);
  const chat = await chatRepo.findOne({ where: { id: chatId } });

  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  if (user.id !== chat.patientId && user.id !== chat.doctorId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
};

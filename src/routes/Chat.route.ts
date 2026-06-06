import { Router } from "express";
import { chatService } from "../services/chat/Chat.service";
import { log } from "../utils/logger";
import { authMiddleware } from "../middlewares/authMiddleware";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import { UserRole } from "../db/interfaces/IUser";
import { ChatController } from "../controllers/ChatController";
import { chatAccessMiddleware } from "../middlewares/chatAccessMiddleware";

const ChatRouter = Router();

ChatRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.PATIENT),
  async (_, res) => {
    try {
      const patientId = res.locals.user.id;
      const chats = await chatService.getPatientChats(patientId);
      res.status(200).json({ chats });
    } catch (err) {
      log({
        type: "error",
        method: "ChatRouter.get('/')",
        info: { error: (err as Error).message },
      });
      res.status(500).json({
        chats: [],
        error: "Internal server error",
      });
    }
  }
);

ChatRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(UserRole.PATIENT),
  async (req, res) => {
    try {
      const { patientId, doctorId } = req.body ?? {};
      if (
        !Number.isInteger(patientId) ||
        patientId <= 0 ||
        !Number.isInteger(doctorId) ||
        doctorId <= 0
      ) {
        res.status(400).json({
          error: "patientId and doctorId must be positive integers",
        });
        return;
      }

      const chatInfo = await ChatController.createChat(patientId, doctorId);
      res.status(201).json(chatInfo);
    } catch (err) {
      log({
        type: "error",
        method: "ChatRouter.post('/')",
        info: { error: (err as Error).message },
      });
      res.status(500).json({
        response: null,
        error: "Internal server error",
      });
    }
  }
);

ChatRouter.post(
  "/:chatId/message",
  authMiddleware,
  chatAccessMiddleware,
  async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const { message } = req.body;
      const response = await chatService.sendMessageToChatbot(chatId, message);
      res.json({ response });
    } catch (error) {
      log({
        type: "error",
        method: "ChatRouter.post('/message')",
        info: { error: (error as Error).message },
      });
      res.status(500).json({
        response: null,
        error: "Internal server error",
      });
    }
  }
);

ChatRouter.get(
  "/:chatId/messages",
  authMiddleware,
  chatAccessMiddleware,
  async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const messages = await chatService.getChatMessages(chatId);
      res.status(200).json({ messages });
    } catch (error) {
      log({
        type: "error",
        method: "ChatRouter.get('/:chatId/messages')",
        info: { error: (error as Error).message },
      });
      res.status(500).json({
        response: null,
        error: "Internal server error",
      });
    }
  }
);

ChatRouter.get(
  "/patient/:patientId",
  authMiddleware,
  roleMiddleware(UserRole.DOCTOR),
  async (req, res) => {
    try {
      const doctorId = res.locals.user.id;
      const patientId = Number(req.params.patientId);
      if (Number.isNaN(patientId) || patientId <= 0) {
        res
          .status(400)
          .json({ chats: [], error: "patientId must be a positive integer" });
        return;
      }
      const chats = await chatService.getFinishedChatsByPatientAndDoctor(
        patientId,
        doctorId
      );
      const patientInfo = await chatService.getPatientInfo(patientId);
      if (!patientInfo) {
        res.status(404).json({ chats: [], patientInfo: null, error: "Patient not found" });
        return;
      }

      res.status(200).json({ chats, patientInfo });
    } catch (error) {
      log({
        type: "error",
        method: "ChatRouter.get('/:chatId/messages')",
        info: { error: (error as Error).message },
      });
      res.status(500).json({
        chats: [],
        patientInfo: null,
        error: "Internal server error",
      });
    }
  }
);

ChatRouter.get(
  "/:chatId/anamnesis",
  authMiddleware,
  chatAccessMiddleware,
  roleMiddleware(UserRole.DOCTOR),
  async (req, res) => {
    try {
      const chatId = Number(req.params.chatId);
      const anamnesisInfo = await chatService.getChatAnamnesisInfo(chatId);
      res.status(200).json({ anamnesisInfo });
    } catch (error) {
      log({
        type: "error",
        method: "ChatRouter.get('/:chatId/anamnesis')",
        info: { error: (error as Error).message },
      });
      res.status(500).json({
        anamnesisInfo: null,
        error: "Internal server error",
      });
    }
  }
);

export default ChatRouter;

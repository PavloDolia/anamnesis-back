import { chatService } from "../services/chat/Chat.service";

export class ChatController {
  public static async createChat(patientId: number, doctorId: number) {
    const createdChat = await chatService.createChat(patientId, doctorId);
    return {
      id: createdChat.id,
      patientId: createdChat.patientId,
      doctorId: createdChat.doctorId,
      isFinished: createdChat.isFinished,
      createdAt: createdChat.createdAt,
    };
  }
}

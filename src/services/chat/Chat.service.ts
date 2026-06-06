import { Content, GoogleGenerativeAI } from "@google/generative-ai";
import dayjs from "dayjs";
import { AppDataSource } from "../../db/data-source";
import { Chat } from "../../db/entities/Chat";
import { ChatMessage, ChatSenderType } from "../../db/entities/ChatMessage";
import { DoctorDetails } from "../../db/entities/DoctorDetails";
import { PatientAnamnesis } from "../../db/entities/PatientAnamnesis";
import { PatientDetails } from "../../db/entities/PatientDetails";
import { PatientDiseaseXref } from "../../db/entities/PatientDiseaseXref";
import { User } from "../../db/entities/User";
import { UserRole } from "../../db/interfaces/IUser";
import {
  END_OF_ANAMNESIS_MESSAGE,
  FIRST_USER_MESSAGE_BEGINNING,
  INITIAL_CHAT_CONTENT,
  LAST_CHAT_MESSAGE,
} from "./constants";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: INITIAL_CHAT_CONTENT,
});

const chatRepo = AppDataSource.getRepository(Chat);
const chatMessageRepo = AppDataSource.getRepository(ChatMessage);
const patientAnamnesisRepo = AppDataSource.getRepository(PatientAnamnesis);
const userRepo = AppDataSource.getRepository(User);
const patientDiseaseXrefRepo = AppDataSource.getRepository(PatientDiseaseXref);

export const chatService = {
  async getPatientChats(patientId: number) {
    const rows = await chatRepo
      .createQueryBuilder("chat")
      .leftJoin(
        DoctorDetails,
        "doctorDetails",
        "doctorDetails.userId = chat.doctorId"
      )
      .leftJoin(User, "doctor", "doctor.id = doctorDetails.userId")
      .select([
        "chat.id AS id",
        'chat.isFinished AS "isFinished"',
        'chat.createdAt AS "createdAt"',
        'doctor.firstName AS "firstName"',
        'doctor.lastName AS "lastName"',
        'doctor.middleName AS "middleName"',
        "doctorDetails.specialty AS specialty",
      ])
      .where("chat.patientId = :patientId", { patientId })
      .orderBy("chat.createdAt", "DESC")
      .getRawMany();

    return rows.map(row => ({
      id: row.id,
      isFinished: Boolean(row.isFinished),
      createdAt: row.createdAt,
      doctor: {
        firstName: row.firstName,
        lastName: row.lastName,
        middleName: row.middleName,
        specialty: row.specialty,
      },
    }));
  },

  async getFinishedChatsByPatientAndDoctor(
    patientId: number,
    doctorId: number
  ) {
    const rows = await chatRepo
      .createQueryBuilder("chat")
      .select(["chat.id AS id", 'chat.updatedAt AS "updatedAt"'])
      .where("chat.patientId = :patientId", { patientId })
      .andWhere("chat.doctorId = :doctorId", { doctorId })
      .andWhere("chat.isFinished = :isFinished", { isFinished: true })
      .orderBy("chat.updatedAt", "DESC")
      .getRawMany();

    return rows;
  },

  async getPatientInfo(patientId: number) {
    const patient = await userRepo
      .createQueryBuilder("user")
      .leftJoin(PatientDetails, "patientDetails", "patientDetails.userId = user.id")
      .select([
        'user.firstName AS "firstName"',
        'user.lastName AS "lastName"',
        'user.middleName AS "middleName"',
        'user.email AS "email"',
        'patientDetails.phoneNumber AS "phoneNumber"',
        'patientDetails.address AS "address"',
        'patientDetails.birthDate AS "birthDate"',
        'patientDetails.sex AS "sex"',
        'patientDetails.weight AS "weight"',
        'patientDetails.height AS "height"',
        'patientDetails.dailyMedication AS "dailyMedication"',
      ])
      .where("user.id = :patientId", { patientId })
      .andWhere("user.role = :role", { role: UserRole.PATIENT })
      .getRawOne();

    if (!patient) {
      return null;
    }

    const diseasesRows = await patientDiseaseXrefRepo
      .createQueryBuilder("patientDiseaseXref")
      .select('patientDiseaseXref.disease AS "disease"')
      .where("patientDiseaseXref.userId = :patientId", { patientId })
      .orderBy("patientDiseaseXref.disease", "ASC")
      .getRawMany();

    return {
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      address: patient.address,
      birthDate: patient.birthDate
        ? dayjs(patient.birthDate).format("DD.MM.YYYY")
        : null,
      sex: patient.sex,
      weight: patient.weight,
      height: patient.height,
      dailyMedication: patient.dailyMedication,
      diseases: diseasesRows.map(diseaseRow => diseaseRow.disease),
    };
  },

  async createChat(patientId: number, doctorId: number): Promise<Chat> {
    const chat = chatRepo.create({
      patientId,
      doctorId,
      isFinished: false,
    });
    const newChat = await chatRepo.save(chat);

    return newChat;
  },

  async sendMessageToChatbot(chatId: number, message: string) {
    const chat = await chatRepo.findOne({ where: { id: chatId } });
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.isFinished) {
      throw new Error("Chat is finished");
    }

    const dbMessages = await chatMessageRepo.find({
      where: { chatId },
      order: { createdAt: "ASC" },
    });

    const outgoingMessage = message;

    const chatSession = model.startChat({
      history: chatService.toGeminiHistory(dbMessages),
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.4,
      },
    });

    const result = await chatSession.sendMessage(outgoingMessage);
    const responseText = result.response.text();

    await chatMessageRepo.save(
      chatMessageRepo.create({
        chatId,
        senderType: ChatSenderType.PATIENT,
        messageText: outgoingMessage,
      })
    );

    if (!responseText.includes(END_OF_ANAMNESIS_MESSAGE)) {
      await chatMessageRepo.save(
        chatMessageRepo.create({
          chatId,
          senderType: ChatSenderType.AI,
          messageText: responseText,
        })
      );
    } else {
      await chatRepo.update(chatId, {
        isFinished: true,
        updatedAt: new Date(),
      });

      await chatMessageRepo.save(
        chatMessageRepo.create({
          chatId,
          senderType: ChatSenderType.AI,
          messageText: LAST_CHAT_MESSAGE,
        })
      );

      const summaryText = responseText
        .replace(END_OF_ANAMNESIS_MESSAGE, "")
        .trim();
      await patientAnamnesisRepo.save(
        patientAnamnesisRepo.create({
          chatId,
          patientId: chat.patientId,
          summaryText,
        })
      );

      return LAST_CHAT_MESSAGE;
    }

    return responseText;
  },

  createFirstUserMessage(message: string) {
    return `${FIRST_USER_MESSAGE_BEGINNING} ${message}`;
  },

  async getChatMessages(chatId: number) {
    const messages = await chatMessageRepo.find({
      where: { chatId },
      order: { createdAt: "ASC" },
    });

    return messages.map(msg => ({
      id: msg.id,
      senderType: msg.senderType,
      text: msg.messageText,
      createdAt: msg.createdAt,
    }));
  },

  async getChatAnamnesisInfo(chatId: number) {
    const [anamnesis, messages] = await Promise.all([
      patientAnamnesisRepo.findOne({ where: { chatId } }),
      chatMessageRepo.find({
        where: { chatId },
        order: { createdAt: "ASC" },
      }),
    ]);

    return {
      summary: anamnesis?.summaryText ?? "",
      messages: messages.map(msg => ({
        id: msg.id,
        senderType: msg.senderType,
        messageText: msg.messageText,
        createdAt: msg.createdAt,
      })),
    };
  },

  toGeminiHistory(messages: ChatMessage[]): Content[] {
    return messages.map(msg => ({
      role: msg.senderType === ChatSenderType.PATIENT ? "user" : "model",
      parts: [{ text: msg.messageText }],
    }));
  },
};

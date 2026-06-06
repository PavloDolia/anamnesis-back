import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Chat } from "./Chat";

export enum ChatSenderType {
  PATIENT = "patient",
  AI = "ai",
}

@Entity("chat_message")
export class ChatMessage {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "chat_id", type: "int" })
  chatId!: number;

  @Column({ name: "sender_type", type: "enum", enum: ChatSenderType })
  senderType!: ChatSenderType;

  @Column({ name: "message_text", type: "text" })
  messageText!: string;

  @Column({
    name: "created_at",
    type: "timestamp",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
  })
  createdAt!: Date;

  @ManyToOne(() => Chat, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "chat_id", referencedColumnName: "id" })
  chat!: Chat;
}

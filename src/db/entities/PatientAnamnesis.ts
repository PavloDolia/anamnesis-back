import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Chat } from "./Chat";
import { User } from "./User";

@Entity("patient_anamnesis")
export class PatientAnamnesis {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "chat_id", type: "int" })
  chatId!: number;

  @Column({ name: "patient_id", type: "int" })
  patientId!: number;

  @Column({ name: "summary_text", type: "text" })
  summaryText!: string;

  @Column({
    name: "created_at",
    type: "timestamp",
    precision: 3,
    default: () => "CURRENT_TIMESTAMP(3)",
  })
  createdAt!: Date;
}

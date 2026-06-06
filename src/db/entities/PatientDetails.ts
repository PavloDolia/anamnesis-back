import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Sex } from "../interfaces/IUser";
import { User } from "./User";

@Entity("patient_details")
@Index("UQ_patient_details_userId", ["userId"], { unique: true })
export class PatientDetails {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "phone_number", type: "varchar", length: 16 })
  phoneNumber!: string;

  @Column({ name: "address", type: "varchar", length: 500 })
  address!: string;

  @Column({ name: "birth_date", type: "date" })
  birthDate!: Date;

  @Column({ name: "sex", type: "enum", enum: Sex })
  sex!: Sex;

  @Column({ name: "weight", type: "smallint", unsigned: true, nullable: true })
  weight!: number | null;

  @Column({ name: "height", type: "smallint", unsigned: true, nullable: true })
  height!: number | null;

  @Column({ name: "daily_medication", type: "text", nullable: true })
  dailyMedication!: string | null;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @OneToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: User;
}

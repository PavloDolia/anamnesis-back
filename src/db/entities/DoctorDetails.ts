import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity("doctor_details")
@Index("UQ_doctor_details_userId", ["userId"], { unique: true })
export class DoctorDetails {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "specialty", type: "varchar", length: 255 })
  specialty!: string;

  @Column({ name: "city_id", type: "int" })
  cityId!: number;

  @Column({ name: "hospital_id", type: "int" })
  hospitalId!: number;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @OneToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: User;
}

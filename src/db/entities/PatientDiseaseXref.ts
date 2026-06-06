import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@Entity("patient_disease_xref")
@Index("UQ_patient_disease_xref_userId_disease", ["userId", "disease"], {
  unique: true,
})
export class PatientDiseaseXref {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "user_id", type: "int" })
  userId!: number;

  @Column({ name: "disease", type: "varchar", length: 255 })
  disease!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: User;
}

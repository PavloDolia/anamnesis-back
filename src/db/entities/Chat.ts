import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("chat")
export class Chat {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "patient_id", type: "int" })
  patientId!: number;

  @Column({ name: "doctor_id", type: "int" })
  doctorId!: number;

  @Column({ name: "is_finished", type: "boolean", default: false })
  isFinished!: boolean;

  @Column({
    name: "created_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt!: Date;

  @Column({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
  })
  updatedAt!: Date;
}

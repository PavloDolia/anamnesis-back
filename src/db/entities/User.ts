import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "../interfaces/IUser";

@Entity("users")
@Index("UQ_users_email", ["email"], { unique: true })
@Index("indx_role_id", ["role", "id"])
export class User {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "first_name", type: "varchar", length: 255 })
  firstName!: string;

  @Column({ name: "last_name", type: "varchar", length: 255 })
  lastName!: string;

  @Column({ name: "middle_name", type: "varchar", length: 255, nullable: true })
  middleName!: string | null;

  @Column({ name: "email", type: "varchar", length: 255 })
  email!: string;

  @Column({ name: "is_email_verified", type: "boolean", default: false })
  isEmailVerified!: boolean;

  @Column({ name: "role", type: "enum", enum: UserRole })
  role!: UserRole;

  @Column({ name: "password", type: "varchar", length: 255, nullable: true })
  password!: string | null;
}

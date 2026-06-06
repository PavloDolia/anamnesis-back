import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("invalid_jwt_tokens")
@Index("IDX_invalid_jwt_tokens_expirationDate", ["expirationDate"])
export class InvalidJwtToken {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "token", type: "varchar", length: 1500 })
  token!: string;

  @Column({ name: "expiration_date", type: "timestamp" })
  expirationDate!: Date;
}

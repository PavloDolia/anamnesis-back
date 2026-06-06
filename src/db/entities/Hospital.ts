import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("hospital")
export class Hospital {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "name", type: "varchar", length: 255 })
  name!: string;

  @Column({ name: "address", type: "varchar", length: 255 })
  address!: string;
}

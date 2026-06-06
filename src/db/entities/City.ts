import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("city")
export class City {
  @PrimaryGeneratedColumn({ name: "id" })
  id!: number;

  @Column({ name: "name", type: "varchar", length: 255 })
  name!: string;
}

import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class commissions_data {
  @PrimaryGeneratedColumn("uuid") id: string

  @Column("text")
  invoice: string

  @Column("text")
  so: string

  @Column("decimal")
  revenue: number

  @Column("decimal")
  gp: number
}

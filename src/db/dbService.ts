import { QueryRunner } from "typeorm";
import { AppDataSource } from "./data-source";

export default class DBService {
  public static async startTransaction() {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    return queryRunner;
  }

  public static async commitTransaction(queryRunner: QueryRunner) {
    await queryRunner.commitTransaction();
    await queryRunner.release();
  }

  public static async rollbackTransaction(queryRunner: QueryRunner) {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
  }
}

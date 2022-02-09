import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordRecoverResetUser1644324629223 implements MigrationInterface {
  name = 'PasswordRecoverResetUser1644324629223';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      ALTER TABLE "user" ADD "passwordHash" character varying;
      ALTER TABLE "user" ADD "passwordHashExpiresAt" TIMESTAMP;
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      ALTER TABLE "user" DROP COLUMN "passwordHashExpiresAt";
      ALTER TABLE "user" DROP COLUMN "passwordHash";
      `
    );
  }
}

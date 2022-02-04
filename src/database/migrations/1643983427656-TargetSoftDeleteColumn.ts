import { MigrationInterface, QueryRunner } from 'typeorm';

export class TargetSoftDeleteColumn1643983427656 implements MigrationInterface {
  name = 'TargetSoftDeleteColumn1643983427656';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "target" ADD "deletedAt" TIMESTAMP');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "target" DROP COLUMN "deletedAt"');
  }
}

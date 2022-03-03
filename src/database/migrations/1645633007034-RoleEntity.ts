import { MigrationInterface, QueryRunner } from 'typeorm';

export class RoleEntity1645633007034 implements MigrationInterface {
  name = 'RoleEntity1645633007034';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      CREATE TABLE "role" ("id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying NOT NULL,
        CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"));
      INSERT INTO "role"(id, name) values (1, 'User') ON CONFLICT DO NOTHING;
      ALTER TABLE "user" ADD "roleId" integer NOT NULL DEFAULT 1;
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
        ALTER TABLE "user" DROP COLUMN "roleId";
        DROP TABLE "role";
      `
    );
  }
}

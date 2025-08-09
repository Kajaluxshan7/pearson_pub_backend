import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEventsTimezone1754472215367 implements MigrationInterface {
  name = 'UpdateEventsTimezone1754472215367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Set default values for null entries before altering the columns
    await queryRunner.query(
      `UPDATE "events" SET "start_date" = NOW() WHERE "start_date" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "events" SET "end_date" = NOW() WHERE "end_date" IS NULL`,
    );

    // Alter the columns to use TIMESTAMP WITH TIME ZONE and add default values
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN "start_date_temp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    );
    await queryRunner.query(
      `UPDATE "events" SET "start_date_temp" = "start_date"`,
    );
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "start_date"`);
    await queryRunner.query(
      `ALTER TABLE "events" RENAME COLUMN "start_date_temp" TO "start_date"`,
    );

    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN "end_date_temp" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
    );
    await queryRunner.query(`UPDATE "events" SET "end_date_temp" = "end_date"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "end_date"`);
    await queryRunner.query(
      `ALTER TABLE "events" RENAME COLUMN "end_date_temp" TO "end_date"`,
    );

    // Remove default values and add NOT NULL constraint
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "start_date" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "start_date" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "end_date" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "events" ALTER COLUMN "end_date" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "end_date"`);
    await queryRunner.query(
      `ALTER TABLE "events" ADD "end_date" date NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "start_date"`);
    await queryRunner.query(
      `ALTER TABLE "events" ADD "start_date" date NOT NULL`,
    );
  }
}

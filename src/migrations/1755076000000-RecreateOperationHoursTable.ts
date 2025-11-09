import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecreateOperationHoursTable1755076000000
  implements MigrationInterface
{
  name = 'RecreateOperationHoursTable1755076000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing operation_hours table if it exists
    await queryRunner.query(`DROP TABLE IF EXISTS "operation_hours" CASCADE`);

    // Create enum type for days of week
    await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "operation_hours_day_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

    // Create operation_hours table with proper schema
    await queryRunner.query(`
            CREATE TABLE "operation_hours" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "day" "operation_hours_day_enum" NOT NULL,
                "open_time" TIME NOT NULL,
                "close_time" TIME NOT NULL,
                "status" boolean NOT NULL DEFAULT true,
                "last_edited_by_admin_id" uuid,
                "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_operation_hours" PRIMARY KEY ("id")
            )
        `);

    // Add foreign key constraint
    await queryRunner.query(`
            ALTER TABLE "operation_hours" 
            ADD CONSTRAINT "FK_operation_hours_admin" 
            FOREIGN KEY ("last_edited_by_admin_id") 
            REFERENCES "admins"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

    // Add unique constraint to ensure one entry per day
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_operation_hours_day" 
            ON "operation_hours" ("day")
        `);

    // Insert default operation hours (Toronto time - stored as TIME, no timezone conversion needed)
    await queryRunner.query(`
            INSERT INTO "operation_hours" ("day", "open_time", "close_time", "status", "timezone")
            VALUES 
                ('monday', '11:00:00', '00:00:00', true, 'America/Toronto'),
                ('tuesday', '11:00:00', '00:00:00', true, 'America/Toronto'),
                ('wednesday', '11:00:00', '02:00:00', true, 'America/Toronto'),
                ('thursday', '11:00:00', '02:00:00', true, 'America/Toronto'),
                ('friday', '11:00:00', '02:00:00', true, 'America/Toronto'),
                ('saturday', '11:00:00', '02:00:00', true, 'America/Toronto'),
                ('sunday', '11:00:00', '02:00:00', true, 'America/Toronto')
            ON CONFLICT DO NOTHING
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "operation_hours" DROP CONSTRAINT IF EXISTS "FK_operation_hours_admin"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE IF EXISTS "operation_hours" CASCADE`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "operation_hours_day_enum"`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixEventsTableTimezone1755075068573 implements MigrationInterface {
  name = 'FixEventsTableTimezone1755075068573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing events table if it exists
    console.log('🔄 Dropping existing events table...');
    await queryRunner.query(`DROP TABLE IF EXISTS "events" CASCADE`);

    // Create the specials_day_day_name_enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "specials_day_day_name_enum" AS ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the events table with proper timezone handling
    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" text,
        "images" text[] NOT NULL DEFAULT '{}',
        "start_date" timestamp with time zone NOT NULL,
        "end_date" timestamp with time zone NOT NULL,
        "last_edited_by_admin_id" uuid,
        "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto',
        "created_at" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
        "updated_at" timestamp with time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
        CONSTRAINT "FK_events_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_events_date_order" CHECK ("end_date" >= "start_date")
      )
    `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_start_date" ON "events" ("start_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_end_date" ON "events" ("end_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_timezone" ON "events" ("timezone")`,
    );

    // Create update trigger for events table
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.triggers
          WHERE trigger_name = 'update_events_updated_at'
        ) THEN
          CREATE TRIGGER update_events_updated_at
          BEFORE UPDATE ON "events"
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END $$;
    `);

    console.log('✅ Events table recreated with proper timezone handling');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the events table
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`);

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_start_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_end_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_timezone"`);

    // Drop trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_events_updated_at ON "events"`,
    );

    console.log('✅ Events table dropped');
  }
}
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SafeSchemaAlignment1754900000003 implements MigrationInterface {
  name = 'SafeSchemaAlignment1754900000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums if they don't exist (safe)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admin_role_enum" AS ENUM('superadmin', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "items_size_enum" AS ENUM('small', 'medium', 'large', 'extra_large');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "days_of_week_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "day_of_week_enum" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "special_type_enum" AS ENUM('daily', 'weekly', 'monthly', 'seasonal', 'limited_time');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Ensure timezone columns exist where needed (safe additions)

    // Add timezone column to events if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'events' AND column_name = 'timezone'
        ) THEN
          ALTER TABLE "events" ADD COLUMN "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto';
        END IF;
      END $$;
    `);

    // Add timezone column to specials if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'specials' AND column_name = 'timezone'
        ) THEN
          ALTER TABLE "specials" ADD COLUMN "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto';
        END IF;
      END $$;
    `);

    // Add timezone column to operation_hours if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'operation_hours' AND column_name = 'timezone'
        ) THEN
          ALTER TABLE "operation_hours" ADD COLUMN "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto';
        END IF;
      END $$;
    `);

    // Add useful indexes for performance (safe)
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_start_date" ON "events" ("start_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_end_date" ON "events" ("end_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_timezone" ON "events" ("timezone")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_seasonal_start_datetime" ON "specials" ("seasonal_start_datetime")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_seasonal_end_datetime" ON "specials" ("seasonal_end_datetime")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_timezone" ON "specials" ("timezone")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operation_hours_timezone" ON "operation_hours" ("timezone")`,
    );

    // Create triggers for updated_at columns if they don't exist
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add missing triggers (safe)
    const tables = [
      'admins',
      'categories',
      'items',
      'events',
      'specials',
      'operation_hours',
      'specials_day',
      'substitute_sides',
      'wing_sauces',
      'addons',
      'stories',
      'admin_invitations',
    ];

    for (const table of tables) {
      await queryRunner.query(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'update_${table}_updated_at'
          ) THEN
            CREATE TRIGGER update_${table}_updated_at
            BEFORE UPDATE ON "${table}"
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers first
    const tables = [
      'admins',
      'categories',
      'items',
      'events',
      'specials',
      'operation_hours',
      'specials_day',
      'substitute_sides',
      'wing_sauces',
      'addons',
      'stories',
      'admin_invitations',
    ];

    for (const table of tables) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS update_${table}_updated_at ON "${table}"`,
      );
    }

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column()`,
    );

    // Note: We don't drop the timezone columns or indexes in rollback
    // as they may be used by the application and dropping them could break things
    // This is a safety measure for production environments
  }
}

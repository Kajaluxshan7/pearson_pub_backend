import { MigrationInterface, QueryRunner } from 'typeorm';

export class RecreateAllTables1755075068572 implements MigrationInterface {
  name = 'RecreateAllTables1755075068572';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create all required enums if they don't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admin_role_enum" AS ENUM('superadmin', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "items_size_enum" AS ENUM('small', 'medium', 'regular', 'large', 'extra_large');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "days_of_week_enum" AS ENUM('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "day_of_week_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "special_type_enum" AS ENUM('daily', 'seasonal', 'latenight');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create admins table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL UNIQUE,
        "password_hash" character varying,
        "google_id" character varying,
        "avatar_url" character varying,
        "first_name" character varying,
        "phone" character varying,
        "address" text,
        "role" "admin_role_enum" NOT NULL DEFAULT 'admin',
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" text,
        "last_edited_by_admin_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_categories_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "category_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "original_price" numeric(10,2),
        "discount" numeric(5,2),
        "price" numeric(10,2),
        "ingredients" text[] NOT NULL DEFAULT '{}',
        "sizes" "items_size_enum"[] NOT NULL DEFAULT '{}',
        "images" text[] NOT NULL DEFAULT '{}',
        "availability" boolean NOT NULL DEFAULT true,
        "visibility" boolean NOT NULL DEFAULT true,
        "is_favourite" boolean NOT NULL DEFAULT false,
        "last_edited_by_admin_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_items_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_items_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create addons table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "addons" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "item_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "description" text,
        "category_type" character varying,
        "last_edited_by_admin_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_addons_item" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_addons_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL,
        CONSTRAINT "UQ_addons_item_name" UNIQUE ("item_id", "name")
      )
    `);

    // Create events table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" text,
        "images" text[] NOT NULL DEFAULT '{}',
        "start_date" timestamp with time zone NOT NULL,
        "end_date" timestamp with time zone NOT NULL,
        "last_edited_by_admin_id" uuid,
        "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto',
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_events_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create stories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "story_name" character varying NOT NULL,
        "description" text,
        "images" text[] NOT NULL DEFAULT '{}',
        "last_edited_by_admin_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_stories_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create substitute_sides table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "substitute_sides" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "description" text,
        "last_edited_by_admin_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_substitute_sides_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create wing_sauces table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wing_sauces" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL UNIQUE,
        "description" text,
        "last_edited_by_admin_id" uuid,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_wing_sauces_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create specials_day table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "specials_day" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "day_name" "days_of_week_enum" NOT NULL UNIQUE,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create specials table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "specials" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "special_type" "special_type_enum" NOT NULL,
        "specials_day_id" uuid,
        "season_name" text,
        "description" text,
        "image_url" text,
        "image_urls" json,
        "seasonal_start_datetime" timestamp with time zone,
        "seasonal_end_datetime" timestamp with time zone,
        "last_edited_by_admin_id" uuid NOT NULL,
        "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto',
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_specials_specials_day" FOREIGN KEY ("specials_day_id") REFERENCES "specials_day"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_specials_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE CASCADE,
        CONSTRAINT "CK_specials_type_constraints" CHECK (
          (special_type = 'daily' AND specials_day_id IS NOT NULL AND seasonal_start_datetime IS NULL AND seasonal_end_datetime IS NULL AND season_name IS NULL) OR
          (special_type = 'seasonal' AND specials_day_id IS NULL AND seasonal_start_datetime IS NOT NULL AND seasonal_end_datetime IS NOT NULL AND season_name IS NOT NULL) OR
          (special_type = 'latenight' AND specials_day_id IS NULL AND seasonal_start_datetime IS NULL AND seasonal_end_datetime IS NULL AND season_name IS NULL)
        )
      )
    `);

    // Create operation_hours table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "operation_hours" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "day" "day_of_week_enum" NOT NULL,
        "open_time" time NOT NULL,
        "close_time" time NOT NULL,
        "status" boolean NOT NULL DEFAULT true,
        "last_edited_by_admin_id" uuid,
        "timezone" character varying(50) NOT NULL DEFAULT 'America/Toronto',
        "created_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "FK_operation_hours_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create admin_invitations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_invitations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL UNIQUE,
        "token_hash" character varying NOT NULL,
        "role" "admin_role_enum" NOT NULL DEFAULT 'admin',
        "expires_at" timestamp NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "invited_by" character varying NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create useful indexes for performance
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
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_items_category_id" ON "items" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_addons_item_id" ON "addons" ("item_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_addons_category_type" ON "addons" ("category_type")`,
    );

    // Create triggers for updated_at columns
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add update triggers for all tables
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

    // Insert default data for specials_day if it doesn't exist
    await queryRunner.query(`
      INSERT INTO "specials_day" ("day_name") 
      SELECT unnest(ARRAY['Sunday'::days_of_week_enum, 'Monday'::days_of_week_enum, 'Tuesday'::days_of_week_enum, 'Wednesday'::days_of_week_enum, 'Thursday'::days_of_week_enum, 'Friday'::days_of_week_enum, 'Saturday'::days_of_week_enum])
      WHERE NOT EXISTS (SELECT 1 FROM "specials_day" LIMIT 1);
    `);
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
    ];

    for (const table of tables) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS update_${table}_updated_at ON "${table}"`,
      );
    }

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column()`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_start_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_end_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_events_timezone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_specials_seasonal_start_datetime"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_specials_seasonal_end_datetime"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_specials_timezone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_operation_hours_timezone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_items_category_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_addons_item_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_addons_category_type"`);

    // Drop tables in reverse order of dependencies
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_invitations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "addons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specials"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operation_hours"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specials_day"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wing_sauces"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "substitute_sides"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "special_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "day_of_week_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "days_of_week_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "items_size_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_role_enum"`);
  }
}

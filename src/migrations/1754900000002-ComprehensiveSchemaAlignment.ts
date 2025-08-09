import { MigrationInterface, QueryRunner } from 'typeorm';

export class ComprehensiveSchemaAlignment1754900000002
  implements MigrationInterface
{
  name = 'ComprehensiveSchemaAlignment1754900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums if they don't exist
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

    // Create tables with proper schema

    // Admins table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admins" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying,
        "google_id" character varying,
        "avatar_url" character varying,
        "first_name" character varying,
        "phone" character varying,
        "address" text,
        "role" "admin_role_enum" NOT NULL DEFAULT 'admin',
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_admins" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admins_email" UNIQUE ("email")
      )
    `);

    // Categories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_categories_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "category_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "original_price" numeric(10,2),
        "discount" numeric(5,2) DEFAULT NULL,
        "price" numeric(10,2) DEFAULT NULL,
        "ingredients" text[] NOT NULL DEFAULT '{}',
        "sizes" "items_size_enum"[] NOT NULL DEFAULT '{}',
        "images" text[] NOT NULL DEFAULT '{}',
        "availability" boolean NOT NULL DEFAULT true,
        "visibility" boolean NOT NULL DEFAULT true,
        "is_favourite" boolean NOT NULL DEFAULT false,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_items_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_items_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Events table with timezone support
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "event_date" TIMESTAMPTZ NOT NULL,
        "start_time" TIME,
        "end_time" TIME,
        "timezone" character varying NOT NULL DEFAULT 'America/Toronto',
        "location" character varying,
        "image_url" text,
        "is_recurring" boolean NOT NULL DEFAULT false,
        "recurrence_pattern" character varying,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_events_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Specials table with timezone support and check constraints
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "specials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "original_price" numeric(10,2),
        "special_price" numeric(10,2) NOT NULL,
        "start_date" TIMESTAMPTZ NOT NULL,
        "end_date" TIMESTAMPTZ NOT NULL,
        "timezone" character varying NOT NULL DEFAULT 'America/Toronto',
        "type" "special_type_enum" NOT NULL DEFAULT 'daily',
        "is_active" boolean NOT NULL DEFAULT true,
        "image_url" text,
        "terms_conditions" text,
        "max_redemptions" integer,
        "current_redemptions" integer NOT NULL DEFAULT 0,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_specials" PRIMARY KEY ("id"),
        CONSTRAINT "FK_specials_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_specials_dates" CHECK ("start_date" <= "end_date"),
        CONSTRAINT "CHK_specials_price" CHECK ("special_price" > 0),
        CONSTRAINT "CHK_specials_original_price" CHECK ("original_price" IS NULL OR "original_price" >= "special_price"),
        CONSTRAINT "CHK_specials_redemptions" CHECK ("current_redemptions" >= 0),
        CONSTRAINT "CHK_specials_max_redemptions" CHECK ("max_redemptions" IS NULL OR "max_redemptions" > 0)
      )
    `);

    // Operation Hours table with timezone support
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "operation_hours" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "day_of_week" "day_of_week_enum" NOT NULL,
        "open_time" TIME,
        "close_time" TIME,
        "timezone" character varying NOT NULL DEFAULT 'America/Toronto',
        "is_closed" boolean NOT NULL DEFAULT false,
        "special_hours_note" text,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_operation_hours" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_operation_hours_day" UNIQUE ("day_of_week"),
        CONSTRAINT "FK_operation_hours_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Specials Days table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "specials_days" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "special_id" uuid NOT NULL,
        "day_of_week" "days_of_week_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_specials_days" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_specials_days_special_day" UNIQUE ("special_id", "day_of_week"),
        CONSTRAINT "FK_specials_days_special" FOREIGN KEY ("special_id") REFERENCES "specials"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Substitute Sides table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "substitute_sides" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "additional_cost" numeric(10,2) NOT NULL DEFAULT 0,
        "is_available" boolean NOT NULL DEFAULT true,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_substitute_sides" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_substitute_sides_name" UNIQUE ("name"),
        CONSTRAINT "FK_substitute_sides_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_substitute_sides_cost" CHECK ("additional_cost" >= 0)
      )
    `);

    // Wing Sauces table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wing_sauces" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "spice_level" integer,
        "is_available" boolean NOT NULL DEFAULT true,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_wing_sauces" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_wing_sauces_name" UNIQUE ("name"),
        CONSTRAINT "FK_wing_sauces_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_wing_sauces_spice_level" CHECK ("spice_level" IS NULL OR ("spice_level" >= 1 AND "spice_level" <= 10))
      )
    `);

    // Addons table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "addons" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "price" numeric(10,2) NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "category" character varying,
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_addons" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_addons_name" UNIQUE ("name"),
        CONSTRAINT "FK_addons_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "CHK_addons_price" CHECK ("price" >= 0)
      )
    `);

    // Stories table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "author" character varying,
        "publication_date" TIMESTAMPTZ,
        "is_featured" boolean NOT NULL DEFAULT false,
        "is_published" boolean NOT NULL DEFAULT false,
        "image_url" text,
        "excerpt" text,
        "tags" text[] NOT NULL DEFAULT '{}',
        "last_edited_by_admin_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_stories" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stories_last_edited_by_admin" FOREIGN KEY ("last_edited_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);

    // Admin Invitations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "role" "admin_role_enum" NOT NULL DEFAULT 'admin',
        "token" character varying NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "is_used" boolean NOT NULL DEFAULT false,
        "invited_by_admin_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_admin_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_invitations_token" UNIQUE ("token"),
        CONSTRAINT "UQ_admin_invitations_email_active" UNIQUE ("email") WHERE "is_used" = false AND "expires_at" > NOW(),
        CONSTRAINT "FK_admin_invitations_invited_by_admin" FOREIGN KEY ("invited_by_admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    // Add indexes for performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_event_date" ON "events" ("event_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_timezone" ON "events" ("timezone")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_events_is_active" ON "events" ("is_active")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_start_date" ON "specials" ("start_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_end_date" ON "specials" ("end_date")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_timezone" ON "specials" ("timezone")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_is_active" ON "specials" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_type" ON "specials" ("type")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_operation_hours_timezone" ON "operation_hours" ("timezone")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_items_category_id" ON "items" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_items_availability" ON "items" ("availability")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_items_visibility" ON "items" ("visibility")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_items_is_favourite" ON "items" ("is_favourite")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stories_is_published" ON "stories" ("is_published")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stories_is_featured" ON "stories" ("is_featured")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stories_publication_date" ON "stories" ("publication_date")`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_invitations_expires_at" ON "admin_invitations" ("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_admin_invitations_is_used" ON "admin_invitations" ("is_used")`,
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

    const tables = [
      'admins',
      'categories',
      'items',
      'events',
      'specials',
      'operation_hours',
      'specials_days',
      'substitute_sides',
      'wing_sauces',
      'addons',
      'stories',
      'admin_invitations',
    ];

    for (const table of tables) {
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON "${table}";
        CREATE TRIGGER update_${table}_updated_at
        BEFORE UPDATE ON "${table}"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Insert default operation hours if none exist
    await queryRunner.query(`
      INSERT INTO "operation_hours" ("day_of_week", "open_time", "close_time", "timezone")
      SELECT unnest(ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']::day_of_week_enum[]),
             '11:00:00'::time,
             '23:00:00'::time,
             'America/Toronto'
      WHERE NOT EXISTS (SELECT 1 FROM "operation_hours" LIMIT 1);
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
      'specials_days',
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

    // Drop tables in reverse order of creation (respecting foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_invitations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "addons"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "wing_sauces"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "substitute_sides"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specials_days"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "operation_hours"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "specials"`);
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

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDisplayTimesAndOrderingToMenuAndSpecials1755076100000
  implements MigrationInterface
{
  name = 'AddDisplayTimesAndOrderingToMenuAndSpecials1755076100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add display_start_time and display_end_time to specials table
    console.log(
      '🔄 Adding display_start_time and display_end_time to specials table...',
    );
    await queryRunner.query(`
      ALTER TABLE "specials" 
      ADD COLUMN IF NOT EXISTS "display_start_time" timestamp with time zone,
      ADD COLUMN IF NOT EXISTS "display_end_time" timestamp with time zone
    `);

    // Add display_order to categories table
    console.log('🔄 Adding display_order to categories table...');
    await queryRunner.query(`
      ALTER TABLE "categories" 
      ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0
    `);

    // Add display_order to items table
    console.log('🔄 Adding display_order to items table...');
    await queryRunner.query(`
      ALTER TABLE "items" 
      ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0
    `);

    // Create indexes for better performance
    console.log('🔄 Creating indexes for display_order fields...');
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_categories_display_order" ON "categories" ("display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_items_display_order" ON "items" ("display_order")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_display_start_time" ON "specials" ("display_start_time")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_specials_display_end_time" ON "specials" ("display_end_time")`,
    );

    // Update existing records to have sequential display orders based on created_at
    console.log('🔄 Setting initial display orders for categories...');
    await queryRunner.query(`
      WITH ordered_categories AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
        FROM categories
      )
      UPDATE categories 
      SET display_order = ordered_categories.rn
      FROM ordered_categories
      WHERE categories.id = ordered_categories.id
    `);

    console.log('🔄 Setting initial display orders for items...');
    await queryRunner.query(`
      WITH ordered_items AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at) as rn
        FROM items
      )
      UPDATE items 
      SET display_order = ordered_items.rn
      FROM ordered_items
      WHERE items.id = ordered_items.id
    `);

    console.log(
      '✅ Successfully added display times and ordering to menu and specials',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_specials_display_end_time"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_specials_display_start_time"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_items_display_order"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_categories_display_order"`,
    );

    // Remove columns
    await queryRunner.query(
      `ALTER TABLE "items" DROP COLUMN IF EXISTS "display_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "display_order"`,
    );
    await queryRunner.query(
      `ALTER TABLE "specials" DROP COLUMN IF EXISTS "display_end_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "specials" DROP COLUMN IF EXISTS "display_start_time"`,
    );
  }
}

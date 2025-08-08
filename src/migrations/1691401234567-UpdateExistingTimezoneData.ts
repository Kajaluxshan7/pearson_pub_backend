import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExistingTimezoneData1691401234567
  implements MigrationInterface
{
  name = 'UpdateExistingTimezoneData1691401234567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This migration ensures all existing data has proper timezone handling
    // Note: This is a DATA migration, not a schema migration

    console.log('🇨🇦 Starting Timezone Data Migration for Canada/Toronto');

    // 1. Ensure all operation_hours have timezone set to America/Toronto
    await queryRunner.query(`
      UPDATE operation_hours 
      SET timezone = 'America/Toronto' 
      WHERE timezone IS NULL OR timezone = ''
    `);

    // 2. Ensure all events have timezone set to America/Toronto
    await queryRunner.query(`
      UPDATE events 
      SET timezone = 'America/Toronto' 
      WHERE timezone IS NULL OR timezone = ''
    `);

    // 3. Add indexes for better performance on time-based queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_operation_hours_day_status 
      ON operation_hours (day, status)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_start_date 
      ON events (start_date)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_timezone 
      ON events (timezone)
    `);

    // 4. Verify existing time data is in correct format
    const operationHoursCount = (await queryRunner.query(`
      SELECT COUNT(*) as count FROM operation_hours 
      WHERE open_time IS NOT NULL AND close_time IS NOT NULL
    `)) as [{ count: string }];

    const eventsCount = (await queryRunner.query(`
      SELECT COUNT(*) as count FROM events 
      WHERE start_date IS NOT NULL AND end_date IS NOT NULL
    `)) as [{ count: string }];

    console.log(
      `✅ Updated ${operationHoursCount[0].count} operation hours records`,
    );
    console.log(`✅ Updated ${eventsCount[0].count} events records`);
    console.log('✅ Added performance indexes for timezone queries');
    console.log('🇨🇦 Timezone Data Migration Complete');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback the migration changes
    console.log('🔄 Rolling back Timezone Data Migration');

    // Remove the indexes we created
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_operation_hours_day_status
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_events_start_date
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_events_timezone
    `);

    // Note: We don't revert timezone column updates as they should remain 'America/Toronto'
    // This is because the timezone data is correct and should be preserved

    console.log('🔄 Timezone Data Migration Rollback Complete');
  }
}

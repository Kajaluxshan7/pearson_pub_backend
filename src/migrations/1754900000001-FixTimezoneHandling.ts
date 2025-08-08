import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTimezoneHandling1754900000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🕐 Starting timezone handling fixes...');

    // 1. Ensure operation hours table has proper UTC time handling
    console.log('📊 Updating operation hours timezone handling...');

    const operationHoursExists = await queryRunner.hasTable('operation_hours');
    if (operationHoursExists) {
      // Check if timezone column exists
      const hasTimezoneColumn = await queryRunner.hasColumn(
        'operation_hours',
        'timezone',
      );
      if (!hasTimezoneColumn) {
        await queryRunner.query(`
          ALTER TABLE "operation_hours" 
          ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'America/Toronto'
        `);
        console.log('✅ Added timezone column to operation_hours');
      }

      // Update existing records to have timezone
      await queryRunner.query(`
        UPDATE "operation_hours" 
        SET "timezone" = 'America/Toronto' 
        WHERE "timezone" IS NULL
      `);
      console.log('✅ Updated existing operation_hours records with timezone');

      // Ensure created_at and updated_at are timestamptz
      const table = await queryRunner.getTable('operation_hours');
      const createdAtColumn = table?.columns.find(
        (col) => col.name === 'created_at',
      );
      const updatedAtColumn = table?.columns.find(
        (col) => col.name === 'updated_at',
      );

      if (createdAtColumn && !createdAtColumn.type.includes('time zone')) {
        await queryRunner.query(`
          ALTER TABLE "operation_hours" 
          ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE 
          USING "created_at"::timestamp AT TIME ZONE 'America/Toronto'
        `);
        console.log('✅ Updated created_at to timestamptz');
      }

      if (updatedAtColumn && !updatedAtColumn.type.includes('time zone')) {
        await queryRunner.query(`
          ALTER TABLE "operation_hours" 
          ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE 
          USING "updated_at"::timestamp AT TIME ZONE 'America/Toronto'
        `);
        console.log('✅ Updated updated_at to timestamptz');
      }
    }

    // 2. Ensure other date/time tables have proper timezone columns
    console.log('📅 Updating other tables timezone handling...');

    const tablesToUpdate = ['event', 'special'];

    for (const tableName of tablesToUpdate) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (tableExists) {
        const hasTimezoneColumn = await queryRunner.hasColumn(
          tableName,
          'timezone',
        );
        if (!hasTimezoneColumn) {
          await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'America/Toronto'
          `);
          console.log(`✅ Added timezone column to ${tableName}`);
        }

        await queryRunner.query(`
          UPDATE "${tableName}" 
          SET "timezone" = 'America/Toronto' 
          WHERE "timezone" IS NULL
        `);
        console.log(`✅ Updated existing ${tableName} records with timezone`);

        // Ensure timestamp columns are timestamptz
        const table = await queryRunner.getTable(tableName);
        const timestampColumns =
          table?.columns.filter(
            (col) =>
              (col.name === 'created_at' ||
                col.name === 'updated_at' ||
                col.name === 'start_date' ||
                col.name === 'end_date' ||
                col.name === 'seasonal_start_datetime' ||
                col.name === 'seasonal_end_datetime') &&
              !col.type.includes('time zone'),
          ) || [];

        for (const column of timestampColumns) {
          await queryRunner.query(`
            ALTER TABLE "${tableName}" 
            ALTER COLUMN "${column.name}" TYPE TIMESTAMP WITH TIME ZONE 
            USING CASE 
              WHEN "${column.name}" IS NULL THEN NULL
              ELSE "${column.name}"::timestamp AT TIME ZONE 'America/Toronto'
            END
          `);
          console.log(`✅ Updated ${tableName}.${column.name} to timestamptz`);
        }
      }
    }

    // 3. Create a function to ensure timezone consistency for new records
    console.log('🔧 Creating timezone enforcement function...');
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION ensure_timezone_consistency()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
          -- Set timezone to America/Toronto if not already set
          IF NEW.timezone IS NULL THEN
            NEW.timezone := 'America/Toronto';
          END IF;
          
          -- Set current timestamp in Toronto timezone for updated_at
          IF NEW.updated_at IS NOT NULL THEN
            NEW.updated_at := NOW() AT TIME ZONE 'America/Toronto';
          END IF;
          
          -- Set created_at only on INSERT
          IF TG_OP = 'INSERT' AND NEW.created_at IS NULL THEN
            NEW.created_at := NOW() AT TIME ZONE 'America/Toronto';
          END IF;
          
          RETURN NEW;
        END IF;
        
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Apply the trigger to relevant tables
    const triggeredTables = ['operation_hours', 'event', 'special'];
    for (const tableName of triggeredTables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (tableExists) {
        // Drop trigger if exists
        await queryRunner.query(`
          DROP TRIGGER IF EXISTS "ensure_timezone_${tableName}" ON "${tableName}"
        `);

        // Check if table has timezone column before creating trigger
        const hasTimezoneColumn = await queryRunner.hasColumn(
          tableName,
          'timezone',
        );
        if (hasTimezoneColumn) {
          await queryRunner.query(`
            CREATE TRIGGER "ensure_timezone_${tableName}"
            BEFORE INSERT OR UPDATE ON "${tableName}"
            FOR EACH ROW EXECUTE FUNCTION ensure_timezone_consistency()
          `);
          console.log(`✅ Applied timezone trigger to ${tableName}`);
        }
      }
    }

    console.log('🎉 Timezone handling fixes completed successfully!');
    console.log('📝 Summary:');
    console.log(
      '   - Operation hours properly handle UTC storage with Toronto timezone conversion',
    );
    console.log(
      '   - All timestamp columns use timestamptz for proper timezone storage',
    );
    console.log('   - Timezone columns added to relevant tables');
    console.log('   - Automatic timezone enforcement triggers created');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Rolling back timezone handling fixes...');

    // Remove triggers
    const triggeredTables = ['operation_hours', 'event', 'special'];
    for (const tableName of triggeredTables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (tableExists) {
        await queryRunner.query(`
          DROP TRIGGER IF EXISTS "ensure_timezone_${tableName}" ON "${tableName}"
        `);
        console.log(`✅ Removed trigger from ${tableName}`);
      }
    }

    // Drop the timezone function
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS ensure_timezone_consistency()`,
    );
    console.log('✅ Removed timezone function');

    console.log('⚠️  Timezone rollback completed');
    console.log(
      '⚠️  Note: Timezone columns and timestamptz types preserved for data integrity',
    );
  }
}

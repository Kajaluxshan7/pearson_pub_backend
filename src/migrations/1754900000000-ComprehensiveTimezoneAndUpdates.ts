// import { MigrationInterface, QueryRunner } from 'typeorm';

// export class ComprehensiveTimezoneAndUpdates1754900000000
//   implements MigrationInterface
// {
//   public async up(queryRunner: QueryRunner): Promise<void> {
//     // Set timezone for the session to ensure consistent behavior
//     await queryRunner.query(`SET timezone = 'America/Toronto'`);

//     console.log(
//       'Starting comprehensive timezone migration for America/Toronto...',
//     );

//     // 1. Update Events table - ensure timezone consistency
//     console.log('Updating Events table...');
//     const eventsTableExists = await queryRunner.hasTable('event');
//     if (eventsTableExists) {
//       // Convert date columns to timestamptz if not already
//       const eventColumns = await queryRunner.getTable('event');
//       const startDateColumn = eventColumns?.columns.find(
//         (col) => col.name === 'start_date',
//       );
//       const endDateColumn = eventColumns?.columns.find(
//         (col) => col.name === 'end_date',
//       );
//       const createdAtColumn = eventColumns?.columns.find(
//         (col) => col.name === 'created_at',
//       );
//       const updatedAtColumn = eventColumns?.columns.find(
//         (col) => col.name === 'updated_at',
//       );

//       // Update start_date to timestamptz
//       if (startDateColumn && !startDateColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "event" 
//           ALTER COLUMN "start_date" TYPE TIMESTAMP WITH TIME ZONE 
//           USING CASE 
//             WHEN "start_date" IS NULL THEN NULL
//             ELSE "start_date"::timestamp AT TIME ZONE 'America/Toronto'
//           END
//         `);
//         console.log('✓ Updated start_date to timestamptz');
//       }

//       // Update end_date to timestamptz
//       if (endDateColumn && !endDateColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "event" 
//           ALTER COLUMN "end_date" TYPE TIMESTAMP WITH TIME ZONE 
//           USING CASE 
//             WHEN "end_date" IS NULL THEN NULL
//             ELSE "end_date"::timestamp AT TIME ZONE 'America/Toronto'
//           END
//         `);
//         console.log('✓ Updated end_date to timestamptz');
//       }

//       // Update created_at to timestamptz
//       if (createdAtColumn && !createdAtColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "event" 
//           ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE 
//           USING "created_at"::timestamp AT TIME ZONE 'America/Toronto'
//         `);
//         console.log('✓ Updated created_at to timestamptz');
//       }

//       // Update updated_at to timestamptz
//       if (updatedAtColumn && !updatedAtColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "event" 
//           ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE 
//           USING "updated_at"::timestamp AT TIME ZONE 'America/Toronto'
//         `);
//         console.log('✓ Updated updated_at to timestamptz');
//       }

//       // Add timezone info column if it doesn't exist
//       const hasTimezoneColumn = await queryRunner.hasColumn(
//         'event',
//         'timezone',
//       );
//       if (!hasTimezoneColumn) {
//         await queryRunner.query(`
//           ALTER TABLE "event" 
//           ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'America/Toronto'
//         `);

//         // Update existing records
//         await queryRunner.query(`
//           UPDATE "event" 
//           SET "timezone" = 'America/Toronto' 
//           WHERE "timezone" IS NULL
//         `);
//         console.log('✓ Added timezone column to events');
//       }
//     }

//     // 2. Update Operation Hours table
//     console.log('Updating Operation Hours table...');
//     const operationHoursExists = await queryRunner.hasTable('operation_hour');
//     if (operationHoursExists) {
//       const opHourColumns = await queryRunner.getTable('operation_hour');
//       const createdAtColumn = opHourColumns?.columns.find(
//         (col) => col.name === 'created_at',
//       );
//       const updatedAtColumn = opHourColumns?.columns.find(
//         (col) => col.name === 'updated_at',
//       );

//       // Update created_at to timestamptz
//       if (createdAtColumn && !createdAtColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "operation_hour" 
//           ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE 
//           USING "created_at"::timestamp AT TIME ZONE 'America/Toronto'
//         `);
//         console.log('✓ Updated operation_hour created_at to timestamptz');
//       }

//       // Update updated_at to timestamptz
//       if (updatedAtColumn && !updatedAtColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "operation_hour" 
//           ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE 
//           USING "updated_at"::timestamp AT TIME ZONE 'America/Toronto'
//         `);
//         console.log('✓ Updated operation_hour updated_at to timestamptz');
//       }

//       // Add timezone column
//       const hasTimezoneColumn = await queryRunner.hasColumn(
//         'operation_hour',
//         'timezone',
//       );
//       if (!hasTimezoneColumn) {
//         await queryRunner.query(`
//           ALTER TABLE "operation_hour" 
//           ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'America/Toronto'
//         `);

//         await queryRunner.query(`
//           UPDATE "operation_hour" 
//           SET "timezone" = 'America/Toronto' 
//           WHERE "timezone" IS NULL
//         `);
//         console.log('✓ Added timezone column to operation_hour');
//       }
//     }

//     // 3. Update Specials table for timezone consistency
//     console.log('Updating Specials table...');
//     const specialsTableExists = await queryRunner.hasTable('special');
//     if (specialsTableExists) {
//       const specialColumns = await queryRunner.getTable('special');
//       const seasonalStartColumn = specialColumns?.columns.find(
//         (col) => col.name === 'seasonal_start_datetime',
//       );
//       const seasonalEndColumn = specialColumns?.columns.find(
//         (col) => col.name === 'seasonal_end_datetime',
//       );
//       const createdAtColumn = specialColumns?.columns.find(
//         (col) => col.name === 'created_at',
//       );
//       const updatedAtColumn = specialColumns?.columns.find(
//         (col) => col.name === 'updated_at',
//       );

//       // Handle seasonal_start_datetime
//       if (
//         seasonalStartColumn &&
//         !seasonalStartColumn.type.includes('time zone')
//       ) {
//         await queryRunner.query(`
//           ALTER TABLE "special" 
//           ALTER COLUMN "seasonal_start_datetime" TYPE TIMESTAMP WITH TIME ZONE 
//           USING CASE 
//             WHEN "seasonal_start_datetime" IS NULL THEN NULL
//             ELSE "seasonal_start_datetime"::timestamp AT TIME ZONE 'America/Toronto'
//           END
//         `);
//         console.log('✓ Updated seasonal_start_datetime to timestamptz');
//       }

//       // Handle seasonal_end_datetime
//       if (seasonalEndColumn && !seasonalEndColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "special" 
//           ALTER COLUMN "seasonal_end_datetime" TYPE TIMESTAMP WITH TIME ZONE 
//           USING CASE 
//             WHEN "seasonal_end_datetime" IS NULL THEN NULL
//             ELSE "seasonal_end_datetime"::timestamp AT TIME ZONE 'America/Toronto'
//           END
//         `);
//         console.log('✓ Updated seasonal_end_datetime to timestamptz');
//       }

//       // Update created_at to timestamptz
//       if (createdAtColumn && !createdAtColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "special" 
//           ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE 
//           USING "created_at"::timestamp AT TIME ZONE 'America/Toronto'
//         `);
//         console.log('✓ Updated special created_at to timestamptz');
//       }

//       // Update updated_at to timestamptz
//       if (updatedAtColumn && !updatedAtColumn.type.includes('time zone')) {
//         await queryRunner.query(`
//           ALTER TABLE "special" 
//           ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE 
//           USING "updated_at"::timestamp AT TIME ZONE 'America/Toronto'
//         `);
//         console.log('✓ Updated special updated_at to timestamptz');
//       }

//       // Add timezone column for specials
//       const hasTimezoneColumn = await queryRunner.hasColumn(
//         'special',
//         'timezone',
//       );
//       if (!hasTimezoneColumn) {
//         await queryRunner.query(`
//           ALTER TABLE "special" 
//           ADD COLUMN "timezone" VARCHAR(50) DEFAULT 'America/Toronto'
//         `);

//         await queryRunner.query(`
//           UPDATE "special" 
//           SET "timezone" = 'America/Toronto' 
//           WHERE "timezone" IS NULL
//         `);
//         console.log('✓ Added timezone column to special');
//       }
//     }

//     // 4. Update timestamps in all other tables to use timezone
//     console.log('Updating timestamps in other tables...');
//     const tables = [
//       'item',
//       'category',
//       'admin',
//       'story',
//       'substitute_side',
//       'wing_sauce',
//     ];

//     for (const tableName of tables) {
//       const tableExists = await queryRunner.hasTable(tableName);
//       if (tableExists) {
//         const tableInfo = await queryRunner.getTable(tableName);
//         const createdAtColumn = tableInfo?.columns.find(
//           (col) => col.name === 'created_at',
//         );
//         const updatedAtColumn = tableInfo?.columns.find(
//           (col) => col.name === 'updated_at',
//         );

//         if (createdAtColumn && !createdAtColumn.type.includes('time zone')) {
//           await queryRunner.query(`
//             ALTER TABLE "${tableName}" 
//             ALTER COLUMN "created_at" TYPE TIMESTAMP WITH TIME ZONE 
//             USING "created_at"::timestamp AT TIME ZONE 'America/Toronto'
//           `);
//           console.log(`✓ Updated ${tableName} created_at to timestamptz`);
//         }

//         if (updatedAtColumn && !updatedAtColumn.type.includes('time zone')) {
//           await queryRunner.query(`
//             ALTER TABLE "${tableName}" 
//             ALTER COLUMN "updated_at" TYPE TIMESTAMP WITH TIME ZONE 
//             USING "updated_at"::timestamp AT TIME ZONE 'America/Toronto'
//           `);
//           console.log(`✓ Updated ${tableName} updated_at to timestamptz`);
//         }
//       }
//     }

//     // 5. Create timezone configuration table
//     console.log('Creating timezone configuration...');
//     const timezoneConfigExists = await queryRunner.hasTable('timezone_config');
//     if (!timezoneConfigExists) {
//       await queryRunner.query(`
//         CREATE TABLE "timezone_config" (
//           "id" SERIAL PRIMARY KEY,
//           "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Toronto',
//           "display_name" VARCHAR(100) NOT NULL DEFAULT 'Eastern Time (Toronto)',
//           "is_active" BOOLEAN NOT NULL DEFAULT true,
//           "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//           "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
//         )
//       `);

//       // Insert default timezone configuration
//       await queryRunner.query(`
//         INSERT INTO "timezone_config" ("timezone", "display_name", "is_active") 
//         VALUES ('America/Toronto', 'Eastern Time (Toronto)', true)
//       `);
//       console.log('✓ Created timezone configuration table');
//     }

//     // 6. Create function to ensure all timestamps are in Toronto timezone
//     console.log('Creating timezone enforcement function...');
//     await queryRunner.query(`
//       CREATE OR REPLACE FUNCTION ensure_toronto_timezone()
//       RETURNS TRIGGER AS $$
//       BEGIN
//         IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
//           -- Set current timestamp in Toronto timezone for updated_at
//           NEW.updated_at := NOW() AT TIME ZONE 'America/Toronto';
          
//           -- Set created_at only on INSERT
//           IF TG_OP = 'INSERT' AND NEW.created_at IS NULL THEN
//             NEW.created_at := NOW() AT TIME ZONE 'America/Toronto';
//           END IF;
          
//           RETURN NEW;
//         END IF;
        
//         RETURN NULL;
//       END;
//       $$ LANGUAGE plpgsql;
//     `);

//     // Apply the trigger to all relevant tables
//     const allTables = ['event', 'operation_hour', 'special', ...tables];
//     for (const tableName of allTables) {
//       const tableExists = await queryRunner.hasTable(tableName);
//       if (tableExists) {
//         // Drop trigger if exists
//         await queryRunner.query(`
//           DROP TRIGGER IF EXISTS "ensure_toronto_timezone_${tableName}" ON "${tableName}"
//         `);

//         // Create trigger only if table has created_at or updated_at columns
//         const tableInfo = await queryRunner.getTable(tableName);
//         const hasTimestampColumns = tableInfo?.columns.some(
//           (col) => col.name === 'created_at' || col.name === 'updated_at',
//         );

//         if (hasTimestampColumns) {
//           await queryRunner.query(`
//             CREATE TRIGGER "ensure_toronto_timezone_${tableName}"
//             BEFORE INSERT OR UPDATE ON "${tableName}"
//             FOR EACH ROW EXECUTE FUNCTION ensure_toronto_timezone()
//           `);
//           console.log(`✓ Applied timezone trigger to ${tableName}`);
//         }
//       }
//     }

//     console.log('✅ Comprehensive timezone migration completed successfully!');
//     console.log(
//       '🕐 All timestamps now use America/Toronto timezone consistently',
//     );
//   }

//   public async down(queryRunner: QueryRunner): Promise<void> {
//     console.log('Rolling back timezone migration...');

//     // Remove triggers
//     const tables = [
//       'item',
//       'category',
//       'admin',
//       'story',
//       'substitute_side',
//       'wing_sauce',
//       'event',
//       'special',
//       'operation_hour',
//     ];

//     for (const tableName of tables) {
//       const tableExists = await queryRunner.hasTable(tableName);
//       if (tableExists) {
//         await queryRunner.query(`
//           DROP TRIGGER IF EXISTS "ensure_toronto_timezone_${tableName}" ON "${tableName}"
//         `);
//         console.log(`✓ Removed trigger from ${tableName}`);
//       }
//     }

//     // Drop the timezone function
//     await queryRunner.query(
//       `DROP FUNCTION IF EXISTS ensure_toronto_timezone()`,
//     );
//     console.log('✓ Removed timezone function');

//     // Drop timezone configuration table
//     await queryRunner.query(`DROP TABLE IF EXISTS "timezone_config"`);
//     console.log('✓ Removed timezone configuration table');

//     // Remove timezone columns (but keep the timestamptz columns for data integrity)
//     const tablesWithTimezone = ['event', 'special', 'operation_hour'];
//     for (const tableName of tablesWithTimezone) {
//       const tableExists = await queryRunner.hasTable(tableName);
//       if (tableExists) {
//         const hasTimezoneColumn = await queryRunner.hasColumn(
//           tableName,
//           'timezone',
//         );
//         if (hasTimezoneColumn) {
//           await queryRunner.query(
//             `ALTER TABLE "${tableName}" DROP COLUMN "timezone"`,
//           );
//           console.log(`✓ Removed timezone column from ${tableName}`);
//         }
//       }
//     }

//     console.warn('⚠️  Timezone migration rollback completed');
//     console.warn(
//       '⚠️  Note: Timestamp columns remain as timestamptz to preserve data integrity',
//     );
//     console.warn(
//       '⚠️  Manual intervention may be required to fully revert timezone changes',
//     );
//   }
// }

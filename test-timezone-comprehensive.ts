import { TimezoneService } from './src/common/services/timezone.service';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.develop.env' });

// Initialize TimezoneService
const timezoneService = new TimezoneService();

console.log('🕐 Testing Comprehensive Timezone Implementation');
console.log('='.repeat(60));

async function testTimezoneImplementation() {
  try {
    // Test 1: Basic timezone conversion
    console.log('\n📊 Test 1: Basic Timezone Conversion');
    console.log('-'.repeat(40));

    const testDate = '2025-08-07T19:30:00'; // 7:30 PM Eastern
    console.log(`Input (Eastern Time): ${testDate}`);

    const utcDate = timezoneService.convertEasternToUtc(testDate);
    console.log(`Converted to UTC: ${utcDate.toISOString()}`);

    const backToEastern = timezoneService.convertUtcToEastern(utcDate);
    console.log(`Back to Eastern: ${backToEastern.toISOString()}`);

    const formatted = timezoneService.formatInEastern(
      utcDate,
      "MMMM dd, yyyy 'at' h:mm a zzz",
    );
    console.log(`Formatted for display: ${formatted}`);

    // Test 2: Current time and timezone info
    console.log('\n🌍 Test 2: Current Time & Timezone Info');
    console.log('-'.repeat(40));

    const currentEastern = timezoneService.getCurrentEasternTime();
    console.log(`Current Eastern Time: ${currentEastern.toISOString()}`);

    const timezoneInfo = timezoneService.getTimezoneInfo();
    console.log(`Timezone Info:`, timezoneInfo);

    const isDST = timezoneService.isDaylightSavingTime();
    console.log(`Is Daylight Saving Time: ${isDST}`);

    // Test 3: Business hours calculation
    console.log('\n🏪 Test 3: Business Hours Calculation');
    console.log('-'.repeat(40));

    const openTime = '11:00';
    const closeTime = '23:00';

    const isOpen = timezoneService.isWithinBusinessHours(openTime, closeTime);
    console.log(`Is currently open (${openTime}-${closeTime}): ${isOpen}`);

    const status = timezoneService.getOperationStatus(
      openTime,
      closeTime,
      true,
    );
    console.log(`Operation status: ${status}`);

    const formattedOpen = timezoneService.formatTimeForDisplay(openTime);
    const formattedClose = timezoneService.formatTimeForDisplay(closeTime);
    console.log(`Formatted times: ${formattedOpen} - ${formattedClose}`);

    // Test 4: Event status calculation
    console.log('\n🎉 Test 4: Event Status Calculation');
    console.log('-'.repeat(40));

    const eventStart = new Date('2025-08-07T23:30:00.000Z'); // UTC (7:30 PM ET)
    const eventEnd = new Date('2025-08-08T03:00:00.000Z'); // UTC (11:00 PM ET)

    const eventStatus = timezoneService.calculateEventStatus(
      eventStart,
      eventEnd,
    );
    console.log(`Event status: ${eventStatus}`);

    const dateRange = timezoneService.formatEventDateRange(
      eventStart,
      eventEnd,
    );
    console.log(`Event date range: ${dateRange}`);

    // Test 5: Database connection and migration check
    console.log('\n🗄️ Test 5: Database Connection Test');
    console.log('-'.repeat(40));

    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE || 'pearson_db',
      entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
      synchronize: false,
    });

    await dataSource.initialize();
    console.log('✅ Database connection successful');

    // Check timezone setting
    const result = await dataSource.query('SHOW timezone');
    console.log(`Database timezone: ${result[0].TimeZone}`);

    // Check if timezone migration was applied
    const migrations = await dataSource.query(`
      SELECT name FROM migrations_history 
      WHERE name LIKE '%ComprehensiveTimezone%'
    `);
    console.log(
      `Timezone migrations applied: ${migrations.length > 0 ? 'Yes' : 'No'}`,
    );

    if (migrations.length > 0) {
      console.log(
        'Migration details:',
        migrations.map((m) => m.name),
      );
    }

    // Test timezone-aware columns
    const eventColumns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND column_name IN ('start_date', 'end_date', 'created_at', 'updated_at', 'timezone')
    `);

    console.log('Events table timezone columns:');
    eventColumns.forEach((col) => {
      console.log(
        `  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`,
      );
    });

    await dataSource.destroy();
    console.log('✅ Database connection closed');

    // Test 6: Edge cases
    console.log('\n🔍 Test 6: Edge Cases');
    console.log('-'.repeat(40));

    // Test overnight hours
    const overnightOpen = '22:00';
    const overnightClose = '02:00';
    const isOpenOvernight = timezoneService.isWithinBusinessHours(
      overnightOpen,
      overnightClose,
    );
    console.log(
      `Overnight hours (${overnightOpen}-${overnightClose}) currently open: ${isOpenOvernight}`,
    );

    // Test DST transition dates
    const dstStart = new Date('2025-03-09T07:00:00.000Z'); // DST starts 2025
    const dstEnd = new Date('2025-11-02T06:00:00.000Z'); // DST ends 2025

    console.log(
      `DST active on ${dstStart.toISOString()}: ${timezoneService.isDaylightSavingTime(dstStart)}`,
    );
    console.log(
      `DST active on ${dstEnd.toISOString()}: ${timezoneService.isDaylightSavingTime(dstEnd)}`,
    );

    console.log('\n✅ All timezone tests completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error during timezone testing:', error);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run the tests
testTimezoneImplementation();

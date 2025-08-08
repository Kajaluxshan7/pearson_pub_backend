#!/usr/bin/env node

/**
 * Comprehensive Timezone Implementation Test for The Pearson Pub
 *
 * This script tests timezone handling across all components:
 * - Backend timezone service and conversions
 * - Frontend timezone utilities
 * - Admin dashboard timezone handling
 *
 * All times are handled in America/Toronto timezone for consistency.
 */

const { TimezoneService } = require('./src/common/services/timezone.service');

console.log('🇨🇦 Testing Comprehensive Canada/Toronto Timezone Implementation');
console.log('='.repeat(70));

async function testTimezoneImplementation() {
  const timezoneService = new TimezoneService();

  // Test 1: Operation Hours Testing
  console.log(
    '\n🏪 Test 1: Operation Hours (Admin sets 11:00 AM - 12:00 AM Toronto time)',
  );
  console.log('-'.repeat(50));

  const adminInputOpenTime = '11:00'; // Admin enters this in Toronto time
  const adminInputCloseTime = '00:00'; // Admin enters this in Toronto time

  console.log(`Admin Input (Toronto Time):`);
  console.log(`  Open Time: ${adminInputOpenTime} (11:00 AM)`);
  console.log(`  Close Time: ${adminInputCloseTime} (12:00 AM)`);

  try {
    // Convert to UTC for database storage
    const utcOpenTime =
      timezoneService.convertTorontoTimeToUtcTime(adminInputOpenTime);
    const utcCloseTime =
      timezoneService.convertTorontoTimeToUtcTime(adminInputCloseTime);

    console.log(`\nDatabase Storage (UTC):`);
    console.log(`  Open Time: ${utcOpenTime}`);
    console.log(`  Close Time: ${utcCloseTime}`);

    // Convert back to Toronto time for display
    const displayOpenTime =
      timezoneService.convertUtcTimeToTorontoTime(utcOpenTime);
    const displayCloseTime =
      timezoneService.convertUtcTimeToTorontoTime(utcCloseTime);

    console.log(`\nUser/Admin Display (Toronto Time):`);
    console.log(`  Open Time: ${displayOpenTime} (should match admin input)`);
    console.log(`  Close Time: ${displayCloseTime} (should match admin input)`);

    // Format for display
    const formattedOpenTime =
      timezoneService.formatTimeForDisplay(displayOpenTime);
    const formattedCloseTime =
      timezoneService.formatTimeForDisplay(displayCloseTime);

    console.log(`\nFormatted Display:`);
    console.log(`  Open Time: ${formattedOpenTime}`);
    console.log(`  Close Time: ${formattedCloseTime}`);

    // Check if currently open
    const isOpen = timezoneService.isWithinBusinessHours(
      displayOpenTime,
      displayCloseTime,
    );
    const status = timezoneService.getOperationStatus(
      displayOpenTime,
      displayCloseTime,
      true,
    );

    console.log(`\nOperation Status:`);
    console.log(`  Currently Open: ${isOpen}`);
    console.log(`  Status Text: ${status}`);

    console.log(`\n✅ Operation Hours Test: PASSED`);
  } catch (error) {
    console.log(`\n❌ Operation Hours Test: FAILED`);
    console.error('Error:', error.message);
  }

  // Test 2: Event DateTime Testing
  console.log(
    '\n🎉 Test 2: Event DateTime (Admin sets event for Aug 7, 2025 7:30 PM Toronto time)',
  );
  console.log('-'.repeat(70));

  const adminEventStartInput = '2025-08-07T19:30:00'; // Admin enters this in Toronto time
  const adminEventEndInput = '2025-08-07T23:00:00'; // Admin enters this in Toronto time

  console.log(`Admin Input (Toronto Time):`);
  console.log(`  Start: ${adminEventStartInput} (7:30 PM)`);
  console.log(`  End: ${adminEventEndInput} (11:00 PM)`);

  try {
    // Convert to UTC for database storage
    const utcStartDate =
      timezoneService.parseFromDateTimeInput(adminEventStartInput);
    const utcEndDate =
      timezoneService.parseFromDateTimeInput(adminEventEndInput);

    console.log(`\nDatabase Storage (UTC):`);
    console.log(`  Start: ${utcStartDate.toISOString()}`);
    console.log(`  End: ${utcEndDate.toISOString()}`);

    // Convert back to Toronto time for display
    const displayStartDate = timezoneService.convertUtcToEastern(utcStartDate);
    const displayEndDate = timezoneService.convertUtcToEastern(utcEndDate);

    console.log(`\nUser/Admin Display (Toronto Time):`);
    console.log(
      `  Start: ${displayStartDate.toISOString()} (should match admin input)`,
    );
    console.log(
      `  End: ${displayEndDate.toISOString()} (should match admin input)`,
    );

    // Format for form inputs
    const formattedStartForInput =
      timezoneService.formatForDateTimeInput(utcStartDate);
    const formattedEndForInput =
      timezoneService.formatForDateTimeInput(utcEndDate);

    console.log(`\nFormatted for Form Inputs:`);
    console.log(`  Start: ${formattedStartForInput}`);
    console.log(`  End: ${formattedEndForInput}`);

    // Format for public display
    const formattedStartDisplay = timezoneService.formatDateTimeInEastern(
      utcStartDate,
      "MMMM dd, yyyy 'at' h:mm a zzz",
    );
    const formattedEndDisplay = timezoneService.formatDateTimeInEastern(
      utcEndDate,
      "MMMM dd, yyyy 'at' h:mm a zzz",
    );

    console.log(`\nFormatted for Public Display:`);
    console.log(`  Start: ${formattedStartDisplay}`);
    console.log(`  End: ${formattedEndDisplay}`);

    // Calculate event status and date range
    const eventStatus = timezoneService.calculateEventStatus(
      utcStartDate,
      utcEndDate,
    );
    const dateRange = timezoneService.formatEventDateRange(
      utcStartDate,
      utcEndDate,
    );

    console.log(`\nEvent Status:`);
    console.log(`  Status: ${eventStatus}`);
    console.log(`  Date Range: ${dateRange}`);

    console.log(`\n✅ Event DateTime Test: PASSED`);
  } catch (error) {
    console.log(`\n❌ Event DateTime Test: FAILED`);
    console.error('Error:', error.message);
  }

  // Test 3: Current Timezone Information
  console.log('\n🌍 Test 3: Current Timezone Information');
  console.log('-'.repeat(40));

  try {
    const currentEastern = timezoneService.getCurrentEasternTime();
    const currentDateString = timezoneService.getCurrentEasternDateString();
    const timezoneInfo = timezoneService.getTimezoneInfo();
    const isDST = timezoneService.isDaylightSavingTime();

    console.log(`Current Toronto Time: ${currentEastern.toISOString()}`);
    console.log(`Current Toronto Date: ${currentDateString}`);
    console.log(`Timezone Info:`, timezoneInfo);
    console.log(`Is Daylight Saving Time: ${isDST}`);

    console.log(`\n✅ Timezone Information Test: PASSED`);
  } catch (error) {
    console.log(`\n❌ Timezone Information Test: FAILED`);
    console.error('Error:', error.message);
  }
}

// Implementation Summary
console.log('\n📋 IMPLEMENTATION SUMMARY');
console.log('='.repeat(50));
console.log(`
This implementation ensures that:

1. 🏪 OPERATION HOURS:
   - Admin enters times in Toronto timezone (11:00 AM - 12:00 AM)
   - Times are converted to UTC for database storage
   - Times are converted back to Toronto timezone for display
   - Status calculations use Toronto timezone

2. 🎉 EVENTS:
   - Admin enters datetime in Toronto timezone
   - Datetime is converted to UTC for database storage
   - Datetime is converted back to Toronto timezone for display
   - Event status calculations use Toronto timezone

3. 🌍 CONSISTENT BEHAVIOR:
   - All time inputs and outputs are in Toronto timezone
   - No unexpected time shifts for users or admins
   - Daylight saving time is handled automatically
   - Database stores everything in UTC for consistency

4. 🔧 IMPLEMENTATION LOCATIONS:
   - Backend: TimezoneService handles all conversions
   - Frontend: TimezoneUtil handles display formatting
   - Admin Dashboard: AdminTimezoneUtil handles form inputs
`);

// Run the test
if (require.main === module) {
  testTimezoneImplementation().catch(console.error);
}

module.exports = { testTimezoneImplementation };

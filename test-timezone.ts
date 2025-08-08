import { TimezoneService } from '../src/common/services/timezone.service';

// Test the timezone service
const timezoneService = new TimezoneService();

console.log('=== Timezone Service Test ===');

// Test current time
console.log('Current UTC time:', new Date().toISOString());
console.log('Current Eastern time:', timezoneService.getCurrentEasternTime());
console.log(
  'Current Eastern date string:',
  timezoneService.getCurrentEasternDateString(),
);

// Test timezone info
const tzInfo = timezoneService.getTimezoneInfo();
console.log('Timezone info:', tzInfo);

// Test date conversion
const testDate = '2025-08-06'; // Date in Eastern Time
try {
  const utcDate = timezoneService.convertEasternToUtc(testDate);
  console.log('Test date (ET):', testDate);
  console.log('Converted to UTC:', utcDate.toISOString());

  const backToEastern = timezoneService.convertUtcToEastern(utcDate);
  console.log('Back to Eastern:', backToEastern);
  console.log('Formatted Eastern:', timezoneService.formatInEastern(utcDate));
} catch (error) {
  console.error('Error in date conversion:', error);
}

// Test datetime conversion
const testDateTime = '2025-08-06T19:30:00'; // 7:30 PM Eastern
try {
  const utcDateTime = timezoneService.convertEasternDateTimeToUtc(testDateTime);
  console.log('Test datetime (ET):', testDateTime);
  console.log('Converted to UTC:', utcDateTime.toISOString());
  console.log(
    'Formatted back to Eastern:',
    timezoneService.formatDateTimeInEastern(utcDateTime),
  );
} catch (error) {
  console.error('Error in datetime conversion:', error);
}

console.log('=== End Test ===');

import { TimezoneService } from './src/common/services/timezone.service';
import { parseISO, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

console.log('🔍 Detailed Timezone Debugging');
console.log('==================================================');

const timezoneService = new TimezoneService();
const TIMEZONE = 'America/Toronto';

// Test input
const inputTime = '11:00';

console.log('\n📋 Step-by-Step Analysis:');
console.log('--------------------------');

// Step 1: What date are we using as reference?
const today = format(new Date(), 'yyyy-MM-dd');
console.log(`1. Reference date: ${today}`);

// Step 2: Create Toronto datetime string
const torontoDateTimeString = `${today}T${inputTime}:00`;
console.log(`2. Toronto datetime string: ${torontoDateTimeString}`);

// Step 3: Parse as local time (not timezone aware)
const torontoDateTime = parseISO(torontoDateTimeString);
console.log(`3. Parsed datetime (naive): ${torontoDateTime.toISOString()}`);

// Step 4: Convert FROM Toronto timezone TO UTC using fromZonedTime
const utcDateTime = fromZonedTime(torontoDateTime, TIMEZONE);
console.log(
  `4. UTC datetime after fromZonedTime: ${utcDateTime.toISOString()}`,
);

// Step 5: Extract just the time portion
const utcTime = format(utcDateTime, 'HH:mm');
console.log(`5. UTC time: ${utcTime}`);

console.log('\n🔄 Reverse Conversion:');
console.log('----------------------');

// Step 6: Create UTC datetime string with Z
const utcDateTimeString = `${today}T${utcTime}:00Z`;
console.log(`6. UTC datetime string: ${utcDateTimeString}`);

// Step 7: Parse UTC datetime
const utcDateTimeParsed = parseISO(utcDateTimeString);
console.log(`7. Parsed UTC datetime: ${utcDateTimeParsed.toISOString()}`);

// Step 8: Convert FROM UTC TO Toronto timezone using toZonedTime
const torontoDateTimeConverted = toZonedTime(utcDateTimeParsed, TIMEZONE);
console.log(
  `8. Toronto datetime after toZonedTime: ${torontoDateTimeConverted.toISOString()}`,
);

// Step 9: Extract time portion
const torontoTime = format(torontoDateTimeConverted, 'HH:mm');
console.log(`9. Toronto time: ${torontoTime}`);

console.log('\n🎯 Comparison:');
console.log('---------------');
console.log(`Original: ${inputTime}`);
console.log(`Round-trip: ${torontoTime}`);
console.log(`Match: ${inputTime === torontoTime}`);

// Let's also check what the current DST offset is
console.log('\n🌍 Current DST Information:');
console.log('----------------------------');
const now = new Date();
const nowToronto = toZonedTime(now, TIMEZONE);
const offset = format(nowToronto, 'xxx', { timeZone: TIMEZONE });
console.log(`Current Toronto offset: ${offset}`);
console.log(
  `Current Toronto time: ${format(nowToronto, 'yyyy-MM-dd HH:mm:ss', { timeZone: TIMEZONE })}`,
);
console.log(`Current UTC time: ${format(now, 'yyyy-MM-dd HH:mm:ss')}`);

// Let's test with a specific known date and time
console.log('\n🧪 Manual Test:');
console.log('----------------');
// August 8, 2025 should be EDT (UTC-4)
const testDate = '2025-08-08T11:00:00'; // 11:00 AM in Toronto
const testParsed = parseISO(testDate);
console.log(`Test datetime (naive): ${testParsed.toISOString()}`);

const testUtc = fromZonedTime(testParsed, TIMEZONE);
console.log(`Test UTC: ${testUtc.toISOString()}`);
console.log(`Test UTC time: ${format(testUtc, 'HH:mm')}`);

// Convert back
const testBackToronto = toZonedTime(testUtc, TIMEZONE);
console.log(`Test back to Toronto: ${testBackToronto.toISOString()}`);
console.log(`Test back to Toronto time: ${format(testBackToronto, 'HH:mm')}`);

import { TimezoneService } from './src/common/services/timezone.service';

console.log('🔍 Expected Timezone Behavior Analysis');
console.log('=====================================');

// In Toronto, during August 2025, we are in EDT (Eastern Daylight Time)
// EDT is UTC-4 (4 hours behind UTC)

console.log('\n🌍 EDT (Eastern Daylight Time) Rules:');
console.log('- Toronto time is UTC-4 during summer');
console.log("- When it's 11:00 AM in Toronto, it's 3:00 PM (15:00) UTC");
console.log("- When it's 3:00 PM (15:00) UTC, it's 11:00 AM in Toronto");

// Let's test what our expected results should be
const timezoneService = new TimezoneService();

console.log('\n📋 Current Implementation Results:');
const result1 = timezoneService.convertTorontoTimeToUtcTime('11:00');
console.log(`11:00 Toronto → ${result1} UTC (should be 15:00)`);

const result2 = timezoneService.convertUtcTimeToTorontoTime('15:00');
console.log(`15:00 UTC → ${result2} Toronto (should be 11:00)`);

console.log('\n✅ Expected vs Actual:');
console.log(
  `Toronto 11:00 → UTC: Expected 15:00, Got ${result1}, Correct: ${result1 === '15:00'}`,
);
console.log(
  `UTC 15:00 → Toronto: Expected 11:00, Got ${result2}, Correct: ${result2 === '11:00'}`,
);

// Let's also test with a few other times to see the pattern
console.log('\n🕐 Additional Test Cases:');

const testCases = [
  { toronto: '09:00', expectedUtc: '13:00' }, // 9 AM Toronto = 1 PM UTC
  { toronto: '12:00', expectedUtc: '16:00' }, // Noon Toronto = 4 PM UTC
  { toronto: '15:00', expectedUtc: '19:00' }, // 3 PM Toronto = 7 PM UTC
  { toronto: '18:00', expectedUtc: '22:00' }, // 6 PM Toronto = 10 PM UTC
];

testCases.forEach((testCase) => {
  const actualUtc = timezoneService.convertTorontoTimeToUtcTime(
    testCase.toronto,
  );
  const backToToronto = timezoneService.convertUtcTimeToTorontoTime(actualUtc);

  console.log(
    `${testCase.toronto} Toronto → ${actualUtc} UTC (expected ${testCase.expectedUtc}) → ${backToToronto} Toronto`,
  );
  console.log(
    `  UTC correct: ${actualUtc === testCase.expectedUtc}, Round-trip correct: ${backToToronto === testCase.toronto}`,
  );
});

// Let's check the timezone info to see if DST is correctly detected
const tzInfo = timezoneService.getTimezoneInfo();
console.log('\n🌍 Current Timezone Information:');
console.log(`Timezone: ${tzInfo.timezone}`);
console.log(`Abbreviation: ${tzInfo.abbreviation} (should be EDT in August)`);
console.log(`Offset: ${tzInfo.offset} (should be -04:00 for EDT)`);
console.log(`Is DST: ${tzInfo.isDST} (should be true in August)`);

// The problem might be fundamental - let me check what date-fns-tz thinks about Toronto timezone
console.log('\n📅 Current Date Analysis:');
const now = new Date();
const currentEastern = timezoneService.getCurrentEasternTime();
console.log(`Current UTC: ${now.toISOString()}`);
console.log(`Current Eastern: ${currentEastern.toISOString()}`);

const diffHours = (now.getTime() - currentEastern.getTime()) / (1000 * 60 * 60);
console.log(`Time difference: ${diffHours} hours (should be ~4 hours for EDT)`);

if (Math.abs(diffHours - 4) < 0.1) {
  console.log('✅ EDT offset is correct');
} else {
  console.log('❌ EDT offset is incorrect');
}

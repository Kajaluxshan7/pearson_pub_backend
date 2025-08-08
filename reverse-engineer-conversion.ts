import { TimezoneService } from './src/common/services/timezone.service';

console.log('🔍 Reverse Engineering the Correct Conversion');
console.log('==============================================');

const timezoneService = new TimezoneService();

// Since UTC → Toronto works correctly, let's use that to find the right UTC times
console.log('\n📋 Finding correct UTC times by testing:');

const torontoTargets = ['09:00', '11:00', '12:00', '15:00', '18:00'];

torontoTargets.forEach((torontoTarget) => {
  console.log(`\n🎯 Target: ${torontoTarget} Toronto`);

  // Test UTC times from 00:00 to 23:59 to find which one gives us the target Toronto time
  for (let utcHour = 0; utcHour < 24; utcHour++) {
    for (let utcMinute = 0; utcMinute < 60; utcMinute += 30) {
      // Test every 30 minutes
      const utcTime = `${String(utcHour).padStart(2, '0')}:${String(utcMinute).padStart(2, '0')}`;
      const resultToronto =
        timezoneService.convertUtcTimeToTorontoTime(utcTime);

      if (resultToronto === torontoTarget) {
        console.log(`  ✅ Found: ${utcTime} UTC → ${resultToronto} Toronto`);

        // Now test if our Toronto→UTC conversion gives us this UTC time back
        const backToUtc =
          timezoneService.convertTorontoTimeToUtcTime(torontoTarget);
        console.log(
          `  🔄 Round-trip: ${torontoTarget} Toronto → ${backToUtc} UTC (should be ${utcTime})`,
        );
        console.log(`  ✅ Round-trip correct: ${backToUtc === utcTime}`);
        break; // Found the correct UTC time, move to next target
      }
    }
  }
});

// Let's also manually verify the EDT rules
console.log('\n🧪 Manual EDT Verification:');
console.log('EDT (Eastern Daylight Time) is UTC-4');
console.log('So Toronto time + 4 hours = UTC time');

const manualTests = [
  { toronto: '09:00', expectedUtc: '13:00' }, // 9 + 4 = 13
  { toronto: '11:00', expectedUtc: '15:00' }, // 11 + 4 = 15
  { toronto: '12:00', expectedUtc: '16:00' }, // 12 + 4 = 16
  { toronto: '15:00', expectedUtc: '19:00' }, // 15 + 4 = 19
  { toronto: '18:00', expectedUtc: '22:00' }, // 18 + 4 = 22
];

manualTests.forEach((test) => {
  const actualFromUtc = timezoneService.convertUtcTimeToTorontoTime(
    test.expectedUtc,
  );
  console.log(
    `${test.expectedUtc} UTC → ${actualFromUtc} Toronto (should be ${test.toronto}). Correct: ${actualFromUtc === test.toronto}`,
  );
});

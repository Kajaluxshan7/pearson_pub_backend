import { TimezoneService } from './src/common/services/timezone.service';

console.log('🧪 Testing Fixed Timezone Service');
console.log('='.repeat(50));

const timezoneService = new TimezoneService();

// Test 1: Toronto time to UTC conversion
console.log('\n📤 Test 1: Toronto Time → UTC');
const torontoTime = '11:00';
console.log(`Input (Toronto): ${torontoTime}`);

try {
  const utcTime = timezoneService.convertTorontoTimeToUtcTime(torontoTime);
  console.log(`Output (UTC): ${utcTime}`);

  // Test 2: UTC back to Toronto time
  console.log('\n📥 Test 2: UTC → Toronto Time');
  console.log(`Input (UTC): ${utcTime}`);

  const backToToronto = timezoneService.convertUtcTimeToTorontoTime(utcTime);
  console.log(`Output (Toronto): ${backToToronto}`);

  // Test 3: Round-trip verification
  console.log('\n🔄 Test 3: Round-trip Verification');
  const isRoundTripCorrect = torontoTime === backToToronto;
  console.log(`Original: ${torontoTime}`);
  console.log(`Round-trip: ${backToToronto}`);
  console.log(`✅ Round-trip successful: ${isRoundTripCorrect}`);

  // Test 4: Current timezone info
  console.log('\n🌍 Test 4: Current Timezone Info');
  const timezoneInfo = timezoneService.getTimezoneInfo();
  console.log(`Timezone: ${timezoneInfo.timezone}`);
  console.log(`Abbreviation: ${timezoneInfo.abbreviation}`);
  console.log(`Offset: ${timezoneInfo.offset}`);
  console.log(`Is DST: ${timezoneInfo.isDST}`);

  // Test 5: Current Eastern time
  console.log('\n🕐 Test 5: Current Eastern Time');
  const currentEasternTime = timezoneService.getCurrentEasternTime();
  console.log(`Current Eastern Time: ${currentEasternTime.toISOString()}`);
  console.log(
    `Formatted: ${timezoneService.formatInEastern(currentEasternTime, 'yyyy-MM-dd HH:mm:ss zzz')}`,
  );
} catch (error) {
  console.error('❌ Error during testing:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('✨ Timezone service test completed!');

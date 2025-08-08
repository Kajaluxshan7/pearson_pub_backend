import { parseISO, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

console.log('🎯 Correct Timezone Conversion');
console.log('==============================');

const TIMEZONE = 'America/Toronto';

function convertTorontoToUtc(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);

  // Use today's date for the conversion
  const today = new Date();

  // Create a new date that represents the time in Toronto
  // We'll create it in UTC space first, then tell fromZonedTime to interpret it as Toronto time
  const torontoTime = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      hours,
      minutes,
      0,
    ),
  );

  console.log(`Toronto time object: ${torontoTime.toISOString()}`);

  // Now convert FROM Toronto timezone TO UTC
  const utcTime = fromZonedTime(torontoTime, TIMEZONE);
  console.log(`UTC result: ${utcTime.toISOString()}`);

  return format(utcTime, 'HH:mm');
}

function convertUtcToToronto(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);

  // Use today's date for the conversion
  const today = new Date();

  // Create a UTC datetime
  const utcTime = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      hours,
      minutes,
      0,
    ),
  );

  console.log(`UTC time object: ${utcTime.toISOString()}`);

  // Convert FROM UTC TO Toronto timezone
  const torontoTime = toZonedTime(utcTime, TIMEZONE);
  console.log(`Toronto result: ${torontoTime.toISOString()}`);

  return format(torontoTime, 'HH:mm');
}

// Test the conversion
console.log('\n📤 Toronto → UTC');
const utcResult = convertTorontoToUtc('11:00');
console.log(`Result: 11:00 Toronto → ${utcResult} UTC`);

console.log('\n📥 UTC → Toronto');
const torontoResult = convertUtcToToronto(utcResult);
console.log(`Result: ${utcResult} UTC → ${torontoResult} Toronto`);

console.log('\n🔄 Round-trip test:');
console.log(`Original: 11:00`);
console.log(`Round-trip: ${torontoResult}`);
console.log(`Success: ${torontoResult === '11:00'}`);

// Let's also manually test the expected conversion
console.log('\n🧪 Manual verification:');
console.log('Expected: 11:00 Toronto (EDT) = 15:00 UTC');

const manualUtc = convertUtcToToronto('15:00');
console.log(`15:00 UTC → ${manualUtc} Toronto`);
console.log(`Should be 11:00: ${manualUtc === '11:00'}`);

const manualToronto = convertTorontoToUtc('11:00');
console.log(`11:00 Toronto → ${manualToronto} UTC`);
console.log(`Should be 15:00: ${manualToronto === '15:00'}`);

// Check current timezone info
const now = new Date();
const nowToronto = toZonedTime(now, TIMEZONE);
console.log('\n🌍 Current timezone status:');
console.log(`Current UTC: ${now.toISOString()}`);
console.log(`Current Toronto: ${nowToronto.toISOString()}`);
console.log(`Offset should be -4 hours for EDT`);

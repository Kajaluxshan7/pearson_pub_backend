import { TimezoneService } from './src/common/services/timezone.service';
import { parseISO, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

console.log('🔧 Testing New Approach');
console.log('==================================================');

const TIMEZONE = 'America/Toronto';
const testTime = '11:00';

// Method 1: Using new Date constructor
console.log('\n🏗️ Method 1: new Date() constructor');
const today = format(new Date(), 'yyyy-MM-dd');
console.log(`Reference date: ${today}`);

const [hours, minutes] = testTime.split(':').map(Number);
const referenceDate = new Date(today + 'T00:00:00Z');
console.log(`Reference UTC midnight: ${referenceDate.toISOString()}`);

const naiveDateTime = new Date(
  referenceDate.getUTCFullYear(),
  referenceDate.getUTCMonth(),
  referenceDate.getUTCDate(),
  hours,
  minutes,
  0,
);
console.log(`Naive datetime: ${naiveDateTime.toISOString()}`);
console.log(`Local time interpretation: ${naiveDateTime.toString()}`);

const utcFromNaive = fromZonedTime(naiveDateTime, TIMEZONE);
console.log(`UTC from naive: ${utcFromNaive.toISOString()}`);
console.log(`UTC time: ${format(utcFromNaive, 'HH:mm')}`);

// Method 2: Using UTC constructor
console.log('\n🌍 Method 2: Date.UTC() constructor');
const utcDateTime = new Date(
  Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
    hours,
    minutes,
    0,
  ),
);
console.log(`UTC datetime: ${utcDateTime.toISOString()}`);

// This represents 11:00 AM Toronto time on the reference date
// We need to convert this "as if it were Toronto time" to actual UTC
const utcFromToronto = fromZonedTime(utcDateTime, TIMEZONE);
console.log(`UTC from Toronto interpretation: ${utcFromToronto.toISOString()}`);
console.log(`UTC time result: ${format(utcFromToronto, 'HH:mm')}`);

// Now reverse it
const backToToronto = toZonedTime(utcFromToronto, TIMEZONE);
console.log(`Back to Toronto: ${backToToronto.toISOString()}`);
console.log(`Toronto time result: ${format(backToToronto, 'HH:mm')}`);

console.log('\n🎯 Results:');
console.log(`Original: ${testTime}`);
console.log(`Round-trip: ${format(backToToronto, 'HH:mm')}`);
console.log(`Success: ${testTime === format(backToToronto, 'HH:mm')}`);

import { parseISO, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

console.log('📚 Understanding date-fns-tz Functions');
console.log('=======================================');

const TIMEZONE = 'America/Toronto';

// Let's say it's 11:00 AM on August 9, 2025 in Toronto
// In August, Toronto is in EDT (UTC-4)
// So 11:00 AM Toronto = 3:00 PM UTC (11 + 4 = 15:00)

console.log('\n🎯 Expected Result:');
console.log('11:00 AM Toronto (EDT) should = 15:00 UTC (3:00 PM)');
console.log('15:00 UTC should = 11:00 AM Toronto (EDT)');

console.log('\n📋 Testing fromZonedTime:');
console.log('(Converts FROM timezone TO UTC)');

// Method 1: Start with a UTC time that represents the display time in Toronto
const utcTime11am = new Date('2025-08-09T11:00:00Z'); // This is 11:00 UTC
console.log(`UTC 11:00: ${utcTime11am.toISOString()}`);

// When we use fromZonedTime, we're saying "treat this time AS IF it's in Toronto timezone"
const fromToronto = fromZonedTime(utcTime11am, TIMEZONE);
console.log(`fromZonedTime result: ${fromToronto.toISOString()}`);
console.log(`fromZonedTime time: ${format(fromToronto, 'HH:mm')}`);

console.log('\n📋 Testing toZonedTime:');
console.log('(Converts FROM UTC TO timezone)');

// Now let's take a UTC time and convert it TO Toronto time for display
const utc15 = new Date('2025-08-09T15:00:00Z'); // 3:00 PM UTC
console.log(`UTC 15:00: ${utc15.toISOString()}`);

const toToronto = toZonedTime(utc15, TIMEZONE);
console.log(`toZonedTime result: ${toToronto.toISOString()}`);
console.log(`toZonedTime time: ${format(toToronto, 'HH:mm')}`);

console.log('\n🔄 Round Trip Test:');
console.log('11:00 Toronto → UTC → Toronto');

// 1. Start with 11:00 in Toronto
const originalTime = '11:00';
console.log(`Original Toronto time: ${originalTime}`);

// 2. Create a date that represents 11:00 (without timezone interpretation)
const localDate = new Date('2025-08-09T11:00:00'); // This will be interpreted in system timezone
console.log(`Local date (system tz): ${localDate.toISOString()}`);

// 3. Convert FROM Toronto timezone TO UTC
const utcFromToronto = fromZonedTime(localDate, TIMEZONE);
console.log(`UTC from Toronto: ${utcFromToronto.toISOString()}`);
console.log(`UTC time: ${format(utcFromToronto, 'HH:mm')}`);

// 4. Convert FROM UTC TO Toronto timezone
const backToToronto = toZonedTime(utcFromToronto, TIMEZONE);
console.log(`Back to Toronto: ${backToToronto.toISOString()}`);
console.log(`Toronto time: ${format(backToToronto, 'HH:mm')}`);

console.log('\n✅ Correct Approach:');
console.log('Using UTC date construction...');

// Create a UTC date that represents the time components without timezone interpretation
const utcDate = new Date(Date.UTC(2025, 7, 9, 11, 0, 0)); // Month is 0-indexed
console.log(`UTC date (11:00): ${utcDate.toISOString()}`);

// Now tell fromZonedTime: "This date represents 11:00 AM in Toronto timezone"
const correctUtc = fromZonedTime(utcDate, TIMEZONE);
console.log(`Correct UTC: ${correctUtc.toISOString()}`);
console.log(`Correct UTC time: ${format(correctUtc, 'HH:mm')}`);

// Convert back
const correctToronto = toZonedTime(correctUtc, TIMEZONE);
console.log(`Correct Toronto: ${correctToronto.toISOString()}`);
console.log(`Correct Toronto time: ${format(correctToronto, 'HH:mm')}`);

console.log('\n🎯 Final Result:');
console.log(`Original: ${originalTime}`);
console.log(`Round-trip: ${format(correctToronto, 'HH:mm')}`);
console.log(`Match: ${originalTime === format(correctToronto, 'HH:mm')}`);

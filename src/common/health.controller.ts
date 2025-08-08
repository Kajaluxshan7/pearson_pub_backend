import { Controller, Get } from '@nestjs/common';
import { TimeService } from '../common/time';

@Controller('health')
export class HealthController {
  @Get('time')
  getTimeInfo() {
    const now = TimeService.nowUTC();
    const torontoNow = TimeService.nowToronto();
    const timezoneInfo = TimeService.getTimezoneInfo(now);

    return {
      server_utc: now.toISOString(),
      toronto_local: TimeService.formatTorontoString(
        now,
        'yyyy-MM-dd HH:mm:ss zzz',
      ),
      toronto_iso: torontoNow.toISOString(),
      timezone_info: timezoneInfo,
      examples: {
        // Test DST boundary dates
        march_dst_start: {
          utc: '2025-03-09T07:00:00.000Z', // 2025-03-09 02:00 EST becomes 03:00 EDT
          toronto: TimeService.formatTorontoString(
            new Date('2025-03-09T07:00:00.000Z'),
          ),
          is_dst: TimeService.isDaylightSavingTime(
            new Date('2025-03-09T07:00:00.000Z'),
          ),
        },
        november_dst_end: {
          utc: '2025-11-02T06:00:00.000Z', // 2025-11-02 02:00 EDT becomes 01:00 EST
          toronto: TimeService.formatTorontoString(
            new Date('2025-11-02T06:00:00.000Z'),
          ),
          is_dst: TimeService.isDaylightSavingTime(
            new Date('2025-11-02T06:00:00.000Z'),
          ),
        },
      },
    };
  }

  @Get('time/test-conversion')
  testTimeConversion() {
    // Test round-trip conversion
    const testInput = '2025-08-15T19:30'; // 7:30 PM Toronto time

    try {
      const utcFromToronto = TimeService.parseTorontoInputToUTC(testInput);
      const backToToronto = TimeService.formatForDateTimeInput(utcFromToronto);

      return {
        input_toronto_local: testInput,
        converted_to_utc: utcFromToronto.toISOString(),
        back_to_toronto_input: backToToronto,
        round_trip_success: testInput === backToToronto,
        timezone_at_test_date: TimeService.getTimezoneInfo(utcFromToronto),
      };
    } catch (error: any) {
      return {
        error: (error as any).message,
        input: testInput,
      };
    }
  }
}

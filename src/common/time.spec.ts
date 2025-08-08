import { TimeService } from './time';

describe('TimeService', () => {
  describe('toUTCFromToronto', () => {
    it('should convert Toronto summer time to UTC correctly', () => {
      // August 15, 2025 7:30 PM Toronto (EDT = UTC-4)
      const torontoInput = '2025-08-15T19:30:00';
      const utcResult = TimeService.toUTCFromToronto(torontoInput);

      // Should be 11:30 PM UTC
      expect(utcResult.toISOString()).toBe('2025-08-15T23:30:00.000Z');
    });

    it('should convert Toronto winter time to UTC correctly', () => {
      // December 15, 2024 7:30 PM Toronto (EST = UTC-5)
      const torontoInput = '2024-12-15T19:30:00';
      const utcResult = TimeService.toUTCFromToronto(torontoInput);

      // Should be 12:30 AM next day UTC
      expect(utcResult.toISOString()).toBe('2024-12-16T00:30:00.000Z');
    });

    it('should handle DST transition correctly - spring forward', () => {
      // March 9, 2025 03:00 Toronto (jumps from 2:00 EST to 3:00 EDT)
      const torontoInput = '2025-03-09T03:00:00';
      const utcResult = TimeService.toUTCFromToronto(torontoInput);

      // Should be 7:00 AM UTC (3:00 EDT = UTC-4)
      expect(utcResult.toISOString()).toBe('2025-03-09T07:00:00.000Z');
    });

    it('should handle DST transition correctly - fall back', () => {
      // November 2, 2025 01:30 Toronto (could be EST or EDT)
      const torontoInput = '2025-11-02T01:30:00';
      const utcResult = TimeService.toUTCFromToronto(torontoInput);

      // Should be 6:30 AM UTC (1:30 EST = UTC-5, after fall back)
      expect(utcResult.toISOString()).toBe('2025-11-02T06:30:00.000Z');
    });

    it('should throw error for invalid input', () => {
      expect(() => TimeService.toUTCFromToronto('')).toThrow();
      expect(() => TimeService.toUTCFromToronto('invalid-date')).toThrow();
    });
  });

  describe('toTorontoFromUTC', () => {
    it('should convert UTC to Toronto summer time correctly', () => {
      // August 15, 2025 11:30 PM UTC
      const utcInput = new Date('2025-08-15T23:30:00.000Z');
      const torontoResult = TimeService.toTorontoFromUTC(utcInput);

      // Should be 7:30 PM EDT (UTC-4)
      expect(torontoResult.getHours()).toBe(19);
      expect(torontoResult.getMinutes()).toBe(30);
    });

    it('should convert UTC to Toronto winter time correctly', () => {
      // December 16, 2024 12:30 AM UTC
      const utcInput = new Date('2024-12-16T00:30:00.000Z');
      const torontoResult = TimeService.toTorontoFromUTC(utcInput);

      // Should be 7:30 PM EST previous day (UTC-5)
      expect(torontoResult.getHours()).toBe(19);
      expect(torontoResult.getMinutes()).toBe(30);
      expect(torontoResult.getDate()).toBe(15);
    });
  });

  describe('parseTorontoInputToUTC', () => {
    it('should parse datetime-local input correctly', () => {
      const input = '2025-08-15T19:30';
      const utcResult = TimeService.parseTorontoInputToUTC(input);

      expect(utcResult.toISOString()).toBe('2025-08-15T23:30:00.000Z');
    });

    it('should throw error for invalid input', () => {
      expect(() => TimeService.parseTorontoInputToUTC('')).toThrow();
      expect(() => TimeService.parseTorontoInputToUTC('invalid')).toThrow();
    });
  });

  describe('formatForDateTimeInput', () => {
    it('should format UTC date for datetime-local input', () => {
      const utcDate = new Date('2025-08-15T23:30:00.000Z');
      const formatted = TimeService.formatForDateTimeInput(utcDate);

      expect(formatted).toBe('2025-08-15T19:30');
    });
  });

  describe('isDaylightSavingTime', () => {
    it('should detect summer DST correctly', () => {
      const summerDate = new Date('2025-08-15T12:00:00.000Z');
      expect(TimeService.isDaylightSavingTime(summerDate)).toBe(true);
    });

    it('should detect winter standard time correctly', () => {
      const winterDate = new Date('2025-01-15T12:00:00.000Z');
      expect(TimeService.isDaylightSavingTime(winterDate)).toBe(false);
    });
  });

  describe('getTimezoneInfo', () => {
    it('should return correct timezone info for summer', () => {
      const summerDate = new Date('2025-08-15T12:00:00.000Z');
      const info = TimeService.getTimezoneInfo(summerDate);

      expect(info.timezone).toBe('America/Toronto');
      expect(info.abbreviation).toBe('EDT');
      expect(info.offset).toBe('-04:00');
      expect(info.isDST).toBe(true);
    });

    it('should return correct timezone info for winter', () => {
      const winterDate = new Date('2025-01-15T12:00:00.000Z');
      const info = TimeService.getTimezoneInfo(winterDate);

      expect(info.timezone).toBe('America/Toronto');
      expect(info.abbreviation).toBe('EST');
      expect(info.offset).toBe('-05:00');
      expect(info.isDST).toBe(false);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain consistency in round-trip conversion', () => {
      const originalInput = '2025-08-15T19:30';

      // Toronto input -> UTC -> back to Toronto input format
      const utc = TimeService.parseTorontoInputToUTC(originalInput);
      const backToInput = TimeService.formatForDateTimeInput(utc);

      expect(backToInput).toBe(originalInput);
    });

    it('should handle DST boundary round-trip correctly', () => {
      const dstInput = '2025-03-09T03:30';

      const utc = TimeService.parseTorontoInputToUTC(dstInput);
      const backToInput = TimeService.formatForDateTimeInput(utc);

      expect(backToInput).toBe(dstInput);
    });
  });
});

import { Injectable } from '@nestjs/common';
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';

/**
 * Centralized timezone utilities for the backend.
 * All date/time operations should use America/Toronto timezone.
 * Database stores UTC, but we convert at API boundaries.
 */
@Injectable()
export class TimeService {
  private static readonly TIMEZONE = 'America/Toronto';

  /**
   * Convert Toronto local time input to UTC for database storage
   * @param naiveLocal - Date string or Date object assumed to be in Toronto timezone
   * @returns UTC Date object ready for database storage
   */
  static toUTCFromToronto(naiveLocal: string | Date): Date {
    if (!naiveLocal) {
      throw new Error('Date input is required');
    }

    let date: Date;
    if (typeof naiveLocal === 'string') {
      date = parseISO(naiveLocal);
      if (!isValid(date)) {
        throw new Error(`Invalid date format: ${naiveLocal}`);
      }
    } else {
      date = naiveLocal;
    }

    // Interpret the date as if it's in Toronto timezone, then convert to UTC
    return fromZonedTime(date, this.TIMEZONE);
  }

  /**
   * Convert UTC date from database to Toronto timezone for display
   * @param utcDate - UTC Date object from database
   * @returns Date object adjusted to Toronto timezone
   */
  static toTorontoFromUTC(utcDate: Date | string): Date {
    if (!utcDate) {
      throw new Error('UTC date is required');
    }

    let date: Date;
    if (typeof utcDate === 'string') {
      date = parseISO(utcDate);
      if (!isValid(date)) {
        throw new Error(`Invalid UTC date format: ${utcDate}`);
      }
    } else {
      date = utcDate;
    }

    return toZonedTime(date, this.TIMEZONE);
  }

  /**
   * Format UTC date as Toronto timezone string
   * @param utcDate - UTC Date object from database
   * @param formatString - Date format string (default: ISO string)
   * @returns Formatted string in Toronto timezone
   */
  static formatTorontoString(
    utcDate: Date | string,
    formatString: string = 'yyyy-MM-dd HH:mm:ss zzz',
  ): string {
    const torontoDate = this.toTorontoFromUTC(utcDate);
    return format(torontoDate, formatString, { timeZone: this.TIMEZONE });
  }

  /**
   * Get current UTC time
   * @returns Current UTC Date object
   */
  static nowUTC(): Date {
    return new Date();
  }

  /**
   * Get current time in Toronto timezone
   * @returns Current Date object in Toronto timezone
   */
  static nowToronto(): Date {
    return this.toTorontoFromUTC(this.nowUTC());
  }

  /**
   * Check if a date is during Daylight Saving Time in Toronto
   * @param date - Date to check (can be UTC or Toronto time)
   * @returns true if DST is active
   */
  static isDaylightSavingTime(date: Date = new Date()): boolean {
    const torontoDate = this.toTorontoFromUTC(date);
    const offset = format(torontoDate, 'xxx', { timeZone: this.TIMEZONE });
    return offset === '-04:00'; // EDT (UTC-4), vs EST (UTC-5)
  }

  /**
   * Get timezone info for a given date
   * @param date - Date to get timezone info for
   * @returns Object with timezone information
   */
  static getTimezoneInfo(date: Date = new Date()): {
    timezone: string;
    abbreviation: string;
    offset: string;
    isDST: boolean;
  } {
    const torontoDate = this.toTorontoFromUTC(date);
    const isDST = this.isDaylightSavingTime(date);

    return {
      timezone: this.TIMEZONE,
      abbreviation: isDST ? 'EDT' : 'EST',
      offset: format(torontoDate, 'xxx', { timeZone: this.TIMEZONE }),
      isDST,
    };
  }

  /**
   * Parse datetime input from frontend (assumed to be Toronto local) and convert to UTC
   * Use this for datetime-local inputs from admin forms
   * @param dateTimeInput - Input from datetime-local field (YYYY-MM-DDTHH:MM)
   * @returns UTC Date object for database storage
   */
  static parseTorontoInputToUTC(dateTimeInput: string): Date {
    if (!dateTimeInput) {
      throw new Error('DateTime input is required');
    }

    // datetime-local format: YYYY-MM-DDTHH:MM
    // We need to interpret this as Toronto local time
    const date = parseISO(dateTimeInput);
    if (!isValid(date)) {
      throw new Error(`Invalid datetime-local format: ${dateTimeInput}`);
    }

    return this.toUTCFromToronto(date);
  }

  /**
   * Format UTC date for datetime-local input field (Toronto timezone)
   * @param utcDate - UTC Date from database
   * @returns String in YYYY-MM-DDTHH:MM format for datetime-local inputs
   */
  static formatForDateTimeInput(utcDate: Date | string): string {
    const torontoDate = this.toTorontoFromUTC(utcDate);
    return format(torontoDate, "yyyy-MM-dd'T'HH:mm", {
      timeZone: this.TIMEZONE,
    });
  }

  /**
   * Validate if a string is a valid datetime input
   * @param dateTimeString - String to validate
   * @returns true if valid datetime format
   */
  static isValidDateTime(dateTimeString: string): boolean {
    if (!dateTimeString) return false;
    try {
      const parsed = parseISO(dateTimeString);
      return isValid(parsed);
    } catch {
      return false;
    }
  }
}

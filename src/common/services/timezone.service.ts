import { Injectable } from '@nestjs/common';
import { toZonedTime, fromZonedTime, format } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';
import { LoggerService } from '../logger/logger.service';

/**
 * Storage contract for date/time values - keep these two rules distinct:
 *
 * 1. `timestamptz` columns (events, specials) hold true UTC instants. They are
 *    converted to Toronto only for display, and parsed back on write via
 *    `parseEventDateTime`, which is offset-aware and will not double-convert
 *    a value the client already sent as UTC.
 *
 * 2. `time` columns (operation hours) hold LITERAL Toronto wall-clock time and
 *    are never zone-converted anywhere in the stack. "We open at 11:00" is a
 *    fact about the clock on the wall, not about an instant, so shifting it to
 *    UTC would make opening hours drift across a DST boundary.
 *
 * Do not add helpers that convert `time` columns between zones.
 *
 * Note on date-fns-tz v3: `format(d, fmt, { timeZone })` does NOT convert the
 * instant - it prints `d`'s local fields and uses `timeZone` only for zone-name
 * tokens. The `toZonedTime(...)` + `format(..., { timeZone })` pairing below is
 * therefore the correct idiom, not a double conversion.
 */
@Injectable()
export class TimezoneService {
  private readonly logger = new LoggerService(TimezoneService.name);
  private readonly TIMEZONE = 'America/Toronto'; // Eastern Time Zone

  /**
   * Convert a date string from Eastern Time to UTC for database storage
   * @param dateString - Date string in YYYY-MM-DD format (assumed to be in ET)
   * @returns UTC Date object
   */
  convertEasternToUtc(dateString: string): Date {
    if (!dateString) {
      throw new Error('Date string is required');
    }
    // Parse the input and convert from Eastern Time to UTC
    const parsed: Date = parseISO(dateString) as Date;
    if (!isValid(parsed)) throw new Error('Invalid date format');
    return fromZonedTime(parsed as Date, this.TIMEZONE) as Date;
  }

  /**
   * Convert a UTC date to Eastern Time for display
   * @param utcDate - UTC Date object from database
   * @returns Date object in Eastern Time
   */
  convertUtcToEastern(utcDate: Date): Date {
    if (!utcDate || !(utcDate instanceof Date)) {
      throw new Error('Valid UTC date is required');
    }
    // Convert UTC Date to a Date object representing the equivalent time in the target timezone
    return toZonedTime(utcDate, this.TIMEZONE);
  }

  /**
   * Format a UTC date as Eastern Time string
   * @param utcDate - UTC Date object from database
   * @param formatString - Format string (default: 'yyyy-MM-dd')
   * @returns Formatted date string in Eastern Time
   */
  formatInEastern(utcDate: Date, formatString: string = 'yyyy-MM-dd'): string {
    if (!utcDate || !(utcDate instanceof Date)) {
      throw new Error('Valid UTC date is required');
    }

    const easternDate = this.convertUtcToEastern(utcDate);
    return format(easternDate, formatString, { timeZone: this.TIMEZONE });
  }

  /**
   * Get current date/time in Eastern Time
   * @returns Current Date object in Eastern Time
   */
  getCurrentEasternTime(): Date {
    return this.convertUtcToEastern(new Date());
  }

  /**
   * Get current date string in Eastern Time
   * @param formatString - Format string (default: 'yyyy-MM-dd')
   * @returns Current date string in Eastern Time
   */
  getCurrentEasternDateString(formatString: string = 'yyyy-MM-dd'): string {
    return this.formatInEastern(new Date(), formatString);
  }

  /**
   * Convert datetime string from Eastern Time to UTC for timestamp storage
   * @param dateTimeString - DateTime string in ISO format (assumed to be in ET)
   * @returns UTC Date object
   */
  convertEasternDateTimeToUtc(dateTimeString: string): Date {
    if (!dateTimeString) {
      throw new Error('DateTime string is required');
    }
    const parsed: Date = parseISO(dateTimeString) as Date;
    if (!isValid(parsed)) throw new Error('Invalid datetime format');
    return fromZonedTime(parsed as Date, this.TIMEZONE) as Date;
  }

  /**
   * Handle datetime string that may already be in UTC format
   * If string ends with 'Z' or contains timezone info, treat as UTC
   * Otherwise, treat as Eastern Time and convert to UTC
   * @param dateTimeString - DateTime string (either UTC ISO or local ET)
   * @returns UTC Date object
   */
  parseEventDateTime(dateTimeString: string): Date {
    if (!dateTimeString) {
      throw new Error('DateTime string is required');
    }

    // Clean up the input string
    const cleanedString = dateTimeString.trim();

    try {
      // If the string includes timezone info (Z or offset) parse directly as UTC
      if (
        cleanedString.endsWith('Z') ||
        /[+-]\d{2}:\d{2}$/.test(cleanedString) ||
        /[+-]\d{4}$/.test(cleanedString)
      ) {
        const date: Date = parseISO(cleanedString);
        if (!isValid(date)) {
          throw new Error(`Invalid UTC datetime format: ${cleanedString}`);
        }
        return date;
      }

      // Check if it's already a valid ISO string without timezone
      const isoDate = parseISO(cleanedString);
      if (isValid(isoDate)) {
        // Treat as Eastern Time and convert to UTC
        return this.convertEasternDateTimeToUtc(cleanedString);
      }

      throw new Error(`Unable to parse datetime: ${cleanedString}`);
    } catch (error: any) {
      this.logger.error(
        'Error parsing event datetime:',
        error?.message || error,
      );
      throw new Error(`Invalid datetime format: ${cleanedString}`);
    }
  }

  /**
   * Format a UTC datetime as Eastern Time string with full datetime
   * @param utcDate - UTC Date object from database
   * @param formatString - Format string (default: 'yyyy-MM-dd HH:mm:ss zzz')
   * @returns Formatted datetime string in Eastern Time
   */
  formatDateTimeInEastern(
    utcDate: Date,
    formatString: string = 'yyyy-MM-dd HH:mm:ss zzz',
  ): string {
    if (!utcDate || !(utcDate instanceof Date)) {
      throw new Error('Valid UTC date is required');
    }

    const easternDate = this.convertUtcToEastern(utcDate);
    return format(easternDate, formatString, { timeZone: this.TIMEZONE });
  }

  /**
   * Format a UTC datetime as Eastern Time in user-friendly format (e.g., "Aug 9, 11 A.M")
   * @param utcDate - UTC Date object from database
   * @returns Formatted datetime string in user-friendly format
   */
  formatDateTimeInEasternFriendly(utcDate: Date): string {
    if (!utcDate || !(utcDate instanceof Date)) {
      throw new Error('Valid UTC date is required');
    }

    const easternDate = this.convertUtcToEastern(utcDate);
    return format(easternDate, 'MMM d, h a', { timeZone: this.TIMEZONE });
  }

  /**
   * Check if a given date is in Daylight Saving Time
   * @param date - Date to check (can be UTC or ET)
   * @returns true if DST is active
   */
  isDaylightSavingTime(date: Date = new Date()): boolean {
    const easternDate = this.convertUtcToEastern(date);
    const offset = format(easternDate, 'xxx', { timeZone: this.TIMEZONE });
    return offset === '-04:00'; // EDT (UTC-4), vs EST (UTC-5)
  }

  /**
   * Get timezone info for a given date
   * @param date - Date to get timezone info for
   * @returns Object with timezone information
   */
  getTimezoneInfo(date: Date = new Date()): {
    timezone: string;
    abbreviation: string;
    offset: string;
    isDST: boolean;
  } {
    const easternDate = this.convertUtcToEastern(date);
    const isDST = this.isDaylightSavingTime(date);

    return {
      timezone: this.TIMEZONE,
      abbreviation: isDST ? 'EDT' : 'EST',
      offset: format(easternDate, 'xxx', { timeZone: this.TIMEZONE }),
      isDST,
    };
  }

  /**
   * Check if current time is within business hours in Toronto timezone
   * @param openTime - Opening time in HH:MM format
   * @param closeTime - Closing time in HH:MM format
   * @param day - Optional specific day to check (defaults to current day)
   * @returns true if currently within business hours
   */
  isWithinBusinessHours(
    openTime: string,
    closeTime: string,
    day?: string,
  ): boolean {
    try {
      const now = this.getCurrentEasternTime();
      const currentDay = format(now, 'EEEE', {
        timeZone: this.TIMEZONE,
      }).toLowerCase();

      const currentTime = format(now, 'HH:mm', { timeZone: this.TIMEZONE });
      const currentMinutes = this.timeToMinutes(currentTime);
      const openMinutes = this.timeToMinutes(openTime);
      const closeMinutes = this.timeToMinutes(closeTime);

      // Handle overnight hours (e.g., 20:30 to 11:30 next day)
      if (closeMinutes < openMinutes) {
        // Check if we're in an overnight operation scenario
        if (day) {
          const specifiedDay = day.toLowerCase();

          // If current time is after opening time and we're on the specified day
          if (currentDay === specifiedDay && currentMinutes >= openMinutes) {
            return true;
          }

          // If current time is before closing time and we're on the day after the specified day
          const dayNames = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          const specifiedDayIndex = dayNames.indexOf(specifiedDay);
          const nextDayIndex = (specifiedDayIndex + 1) % 7;
          const nextDay = dayNames[nextDayIndex];

          if (currentDay === nextDay && currentMinutes <= closeMinutes) {
            return true;
          }

          return false;
        } else {
          // For current day checking without specified day
          return (
            currentMinutes >= openMinutes || currentMinutes <= closeMinutes
          );
        }
      }

      // Regular hours (same day)
      if (day && day.toLowerCase() !== currentDay) {
        return false;
      }

      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
    } catch (error: any) {
      this.logger.error(
        'Error checking business hours:',
        error?.message || error,
      );
      return false;
    }
  }

  /**
   * Convert time string to minutes for comparison
   * @param timeString - Time in HH:MM format
   * @returns minutes since midnight
   */
  private timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Format time for display in Toronto timezone
   * @param timeString - Time string in HH:MM format
   * @returns Formatted time string (e.g., "2:30 PM")
   */
  formatTimeForDisplay(timeString: string): string {
    try {
      const today = format(new Date(), 'yyyy-MM-dd', {
        timeZone: this.TIMEZONE,
      });
      const dateTime = parseISO(`${today}T${timeString}:00`);

      return format(dateTime, 'h:mm a', { timeZone: this.TIMEZONE });
    } catch (error: any) {
      this.logger.error(
        'Error formatting time for display:',
        error?.message || error,
      );
      return timeString;
    }
  }

  /**
   * Get status text for operation hours
   * @param openTime - Opening time in HH:MM format
   * @param closeTime - Closing time in HH:MM format
   * @param isEnabled - Whether the operation hours are enabled
   * @param day - Optional specific day
   * @returns Status text like "Open Now", "Closed Now", "Opens at 11:00 AM"
   */
  getOperationStatus(
    openTime: string,
    closeTime: string,
    isEnabled: boolean,
    day?: string,
  ): string {
    if (!isEnabled) {
      return 'Closed';
    }

    const isOpen = this.isWithinBusinessHours(openTime, closeTime, day);

    if (isOpen) {
      return `Open until ${this.formatTimeForDisplay(closeTime)}`;
    } else {
      return `Opens at ${this.formatTimeForDisplay(openTime)}`;
    }
  }

  /**
   * Calculate event status based on current Toronto time
   * @param startDate - Event start date (UTC)
   * @param endDate - Event end date (UTC)
   * @returns Event status: 'upcoming', 'current', or 'ended'
   */
  calculateEventStatus(
    startDate: Date,
    endDate: Date,
  ): 'upcoming' | 'current' | 'ended' {
    // Compare in UTC directly since all dates are stored as UTC
    const now = new Date();

    if (now < startDate) return 'upcoming';
    if (now >= startDate && now <= endDate) return 'current';
    return 'ended';
  }

  /**
   * Format event date range for display
   * @param startDate - Event start date (UTC)
   * @param endDate - Event end date (UTC)
   * @returns Formatted date range string
   */
  formatEventDateRange(startDate: Date, endDate: Date): string {
    const startEastern = this.convertUtcToEastern(startDate);
    const endEastern = this.convertUtcToEastern(endDate);

    const startDateStr = format(startEastern, 'MMMM d, yyyy', {
      timeZone: this.TIMEZONE,
    });
    const endDateStr = format(endEastern, 'MMMM d, yyyy', {
      timeZone: this.TIMEZONE,
    });

    // If same date, show date once with time range
    if (startDateStr === endDateStr) {
      const startTime = format(startEastern, 'h:mm a', {
        timeZone: this.TIMEZONE,
      });
      const endTime = format(endEastern, 'h:mm a', { timeZone: this.TIMEZONE });
      return `${startDateStr} from ${startTime} to ${endTime}`;
    }

    // Different dates
    const startDateTime = format(startEastern, "MMMM d, yyyy 'at' h:mm a", {
      timeZone: this.TIMEZONE,
    });
    const endDateTime = format(endEastern, "MMMM d, yyyy 'at' h:mm a", {
      timeZone: this.TIMEZONE,
    });
    return `${startDateTime} to ${endDateTime}`;
  }

  /**
   * Format datetime string for form inputs (ISO format in Toronto timezone)
   * @param utcDate - UTC Date object from database
   * @returns ISO datetime string in Toronto timezone for form inputs
   */
  formatForDateTimeInput(utcDate: Date): string {
    if (!utcDate || !(utcDate instanceof Date)) {
      return '';
    }

    try {
      const torontoDate = this.convertUtcToEastern(utcDate);
      return format(torontoDate, "yyyy-MM-dd'T'HH:mm", {
        timeZone: this.TIMEZONE,
      });
    } catch (error: any) {
      this.logger.error(
        'Error formatting for datetime input:',
        error?.message || error,
      );
      return '';
    }
  }

  /**
   * Parse datetime from form input and convert to UTC
   * @param dateTimeString - DateTime string from form input (ISO format, assumed to be Toronto time)
   * @returns UTC Date object for database storage
   */
  parseFromDateTimeInput(dateTimeString: string): Date {
    if (!dateTimeString) {
      throw new Error('DateTime string is required');
    }

    // Interpret the input as a Toronto-local datetime and convert to UTC
    const parsed: Date = parseISO(dateTimeString);
    if (!isValid(parsed)) throw new Error('Invalid datetime format');
    return fromZonedTime(parsed, this.TIMEZONE);
  }
}

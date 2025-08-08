import { Injectable } from '@nestjs/common';
import * as moment from 'moment-timezone';

@Injectable()
export class TimezoneService {
  private readonly timezone = 'America/Toronto';

  /**
   * Convert any date to America/Toronto timezone
   */
  convertToToronto(date: Date | string): moment.Moment {
    return moment(date).tz(this.timezone);
  }

  /**
   * Get current time in America/Toronto timezone
   */
  now(): moment.Moment {
    return moment().tz(this.timezone);
  }

  /**
   * Format date for display in Toronto timezone
   */
  formatForDisplay(
    date: Date | string,
    format: string = 'YYYY-MM-DD HH:mm:ss',
  ): string {
    return this.convertToToronto(date).format(format);
  }

  /**
   * Format date for API response (ISO string in Toronto timezone)
   */
  formatForAPI(date: Date | string): string {
    return this.convertToToronto(date).toISOString();
  }

  /**
   * Parse date string and convert to Toronto timezone
   */
  parseToToronto(dateString: string): moment.Moment {
    return moment.tz(dateString, this.timezone);
  }

  /**
   * Get timezone info
   */
  getTimezoneInfo(): {
    timezone: string;
    offset: string;
    abbreviation: string;
  } {
    const now = this.now();
    return {
      timezone: this.timezone,
      offset: now.format('Z'),
      abbreviation: now.format('z'),
    };
  }

  /**
   * Convert date to database format (ensuring timezone awareness)
   */
  toDatabaseFormat(date: Date | string): Date {
    return this.convertToToronto(date).toDate();
  }

  /**
   * Check if time is within business hours (for operation hours)
   */
  isWithinBusinessHours(
    openTime: string,
    closeTime: string,
    checkTime?: Date | string,
  ): boolean {
    const now = checkTime ? this.convertToToronto(checkTime) : this.now();
    const todayOpen = moment.tz(
      `${now.format('YYYY-MM-DD')} ${openTime}`,
      this.timezone,
    );
    const todayClose = moment.tz(
      `${now.format('YYYY-MM-DD')} ${closeTime}`,
      this.timezone,
    );

    // Handle overnight hours (e.g., 22:00 to 02:00)
    if (todayClose.isBefore(todayOpen)) {
      todayClose.add(1, 'day');
    }

    return now.isBetween(todayOpen, todayClose, null, '[]');
  }

  /**
   * Format operation hours for display
   */
  formatOperationHours(openTime: string, closeTime: string): string {
    const open = moment(openTime, 'HH:mm').format('h:mm A');
    const close = moment(closeTime, 'HH:mm').format('h:mm A');
    return `${open} - ${close}`;
  }

  /**
   * Get day name in Toronto timezone
   */
  getCurrentDayName(): string {
    return this.now().format('dddd').toLowerCase();
  }

  /**
   * Format event date range
   */
  formatEventDateRange(
    startDate: Date | string,
    endDate?: Date | string,
  ): string {
    const start = this.convertToToronto(startDate);

    if (!endDate) {
      return start.format('MMMM D, YYYY [at] h:mm A');
    }

    const end = this.convertToToronto(endDate);

    // Same day
    if (start.format('YYYY-MM-DD') === end.format('YYYY-MM-DD')) {
      return `${start.format('MMMM D, YYYY')} from ${start.format('h:mm A')} to ${end.format('h:mm A')}`;
    }

    // Different days
    return `${start.format('MMMM D, YYYY [at] h:mm A')} - ${end.format('MMMM D, YYYY [at] h:mm A')}`;
  }
}

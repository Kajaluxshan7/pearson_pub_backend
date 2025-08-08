import { Transform } from 'class-transformer';
import { TimeService } from './time';

/**
 * Transformer decorator for converting UTC dates from database to Toronto timezone for API responses
 * Use on DTO properties that should be displayed in Toronto timezone
 */
export function TorontoDateTime() {
  return Transform(({ value }) => {
    if (!value) return null;
    try {
      return TimeService.formatTorontoString(value, 'yyyy-MM-dd HH:mm:ss zzz');
    } catch (error) {
      console.error('Error transforming to Toronto datetime:', error);
      return value;
    }
  });
}

/**
 * Transformer decorator for converting UTC dates from database to Toronto timezone ISO string
 * Use when frontend expects ISO format but in Toronto timezone
 */
export function TorontoDateTimeISO() {
  return Transform(({ value }) => {
    if (!value) return null;
    try {
      const torontoDate = TimeService.toTorontoFromUTC(value);
      return torontoDate.toISOString();
    } catch (error) {
      console.error('Error transforming to Toronto ISO:', error);
      return value;
    }
  });
}

/**
 * Transformer decorator for converting Toronto timezone input to UTC for database storage
 * Use on DTOs for incoming requests with datetime fields
 */
export function FromTorontoDateTime() {
  return Transform(({ value }) => {
    if (!value) return null;
    try {
      return TimeService.toUTCFromToronto(value);
    } catch (error) {
      console.error('Error transforming from Toronto datetime:', error);
      throw new Error(`Invalid datetime format: ${value}`);
    }
  });
}

/**
 * Transformer decorator for datetime-local input fields
 * Converts Toronto local datetime input to UTC for database storage
 */
export function FromTorontoDateTimeInput() {
  return Transform(({ value }) => {
    if (!value) return null;
    try {
      return TimeService.parseTorontoInputToUTC(value);
    } catch (error) {
      console.error('Error transforming from Toronto datetime input:', error);
      throw new Error(`Invalid datetime input format: ${value}`);
    }
  });
}

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { AsyncLocalStorage } from 'async_hooks';

interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private asyncLocalStorage = new AsyncLocalStorage<LogContext>();

  constructor(private context?: string) {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label'],
      }),
      isDevelopment
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, metadata }) => {
              const meta = metadata as any;
              const contextStr = meta?.context ? `[${meta.context}]` : '';
              const requestId = meta?.requestId ? `[${meta.requestId}]` : '';
              const extra = Object.keys(meta || {}).filter(
                (k) => !['context', 'requestId'].includes(k),
              );
              const extraStr =
                extra.length > 0
                  ? `\n${JSON.stringify(
                      extra.reduce((acc, k) => ({ ...acc, [k]: meta[k] }), {}),
                      null,
                      2,
                    )}`
                  : '';
              return `${timestamp} ${level} ${contextStr}${requestId} ${message}${extraStr}`;
            }),
          )
        : winston.format.json(),
    );

    // Configure transports
    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        level: logLevel,
      }),
    ];

    // File transports for production
    if (!isDevelopment) {
      // Error logs - rotated daily, kept for 30 days
      transports.push(
        new winston.transports.DailyRotateFile({
          level: 'error',
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          maxSize: '20m',
          zippedArchive: true,
        }),
      );

      // Combined logs - rotated daily, kept for 14 days
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
          maxSize: '20m',
          zippedArchive: true,
        }),
      );

      // HTTP logs - for request/response logging
      transports.push(
        new winston.transports.DailyRotateFile({
          level: 'http',
          filename: 'logs/http-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '7d',
          maxSize: '20m',
          zippedArchive: true,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  private getMetadata(context?: string): LogContext {
    const store = this.asyncLocalStorage.getStore() || {};
    return {
      ...store,
      context: context || this.context,
    };
  }

  log(message: string, context?: string) {
    this.logger.info(message, { metadata: this.getMetadata(context) });
  }

  error(message: string, trace?: string, context?: string) {
    const metadata = this.getMetadata(context);
    if (trace) {
      metadata.trace = trace;
    }
    this.logger.error(message, { metadata });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { metadata: this.getMetadata(context) });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { metadata: this.getMetadata(context) });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { metadata: this.getMetadata(context) });
  }

  // HTTP logging for requests
  http(message: string, metadata?: LogContext) {
    this.logger.http(message, {
      metadata: { ...this.getMetadata(), ...metadata },
    });
  }

  // Set context for async operations (like request tracking)
  setContext(context: LogContext, callback: () => void | Promise<void>) {
    return this.asyncLocalStorage.run(context, callback);
  }

  // Get request ID from context
  getRequestId(): string | undefined {
    const store = this.asyncLocalStorage.getStore();
    return store?.requestId;
  }
}

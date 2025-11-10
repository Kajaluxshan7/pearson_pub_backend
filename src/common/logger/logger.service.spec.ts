import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    service = new LoggerService('TestContext');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log info messages', () => {
    expect(() => {
      service.log('Test log message', 'TestContext');
    }).not.toThrow();
  });

  it('should log error messages', () => {
    expect(() => {
      service.error('Test error message', 'stack trace', 'TestContext');
    }).not.toThrow();
  });

  it('should log warning messages', () => {
    expect(() => {
      service.warn('Test warning message', 'TestContext');
    }).not.toThrow();
  });

  it('should log debug messages', () => {
    expect(() => {
      service.debug('Test debug message', 'TestContext');
    }).not.toThrow();
  });

  it('should log verbose messages', () => {
    expect(() => {
      service.verbose('Test verbose message', 'TestContext');
    }).not.toThrow();
  });

  it('should log HTTP messages', () => {
    expect(() => {
      service.http('Test HTTP message', {
        requestId: 'test-123',
        method: 'GET',
        url: '/api/test',
      });
    }).not.toThrow();
  });

  it('should set and get context', () => {
    const context = { requestId: 'test-123', userId: 'user-456' };

    service.setContext(context, () => {
      const requestId = service.getRequestId();
      expect(requestId).toBe('test-123');
    });
  });
});

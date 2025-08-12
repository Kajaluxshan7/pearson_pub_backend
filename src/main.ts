import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

// Global error handler
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

async function bootstrap() {
  const port = 5000;
  console.log('🚀 Starting application on port:', port);

  const app = await NestFactory.create(AppModule);

  // Configure custom body parser with increased size limits
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://15.223.253.194:3000',
      'http://15.223.253.194:3002',
    ], // Add your frontend URLs
    credentials: true,
  });

  // Enable cookie parser
  app.use(cookieParser());

  // Enable validation pipes with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  // Add global error logging
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('❌ HTTP ERROR:', {
      method: req.method,
      url: req.url,
      error: err.message,
      stack: err.stack,
      body: req.body,
    });
    next(err);
  });

  await app.listen(port, 'localhost');
  console.log(`✅ Application is running on: http://localhost:${port}`);
}
void bootstrap();

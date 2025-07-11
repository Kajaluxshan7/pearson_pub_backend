import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
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
  const port = process.env.PORT || 5000;
  console.log('🚀 Starting application on port:', port);

  const app = await NestFactory.create(AppModule); // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3004',
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

  await app.listen(port, '0.0.0.0');
  console.log(`✅ Application is running on: http://0.0.0.0:${port}`);
}
bootstrap();

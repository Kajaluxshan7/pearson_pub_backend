import * as Joi from 'joi';

/**
 * Environment variable validation schema
 * This ensures all critical environment variables are present and valid at application startup
 */
export const envValidationSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5000),

  // Database Configuration
  DATABASE_URL: Joi.string().uri().optional(),
  DB_HOST: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_PASSWORD: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_DATABASE: Joi.string().when('DATABASE_URL', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  DB_SSL: Joi.string().valid('true', 'false').default('false'),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required().messages({
    'string.min': 'JWT_SECRET must be at least 32 characters long for security',
    'any.required': 'JWT_SECRET is required but not configured',
  }),
  JWT_EXPIRY: Joi.string().default('1h'),

  // CORS Configuration
  CORS_ORIGINS: Joi.string().required().messages({
    'any.required':
      'CORS_ORIGINS is required. Set it to comma-separated list of allowed origins',
  }),

  // Frontend URL
  FRONTEND_URL: Joi.string().uri().required().messages({
    'any.required': 'FRONTEND_URL is required for email verification links',
  }),

  // AWS Configuration (optional in development, required in production)
  AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_SECRET_ACCESS_KEY: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_S3_BUCKET_NAME: Joi.string().default('pearson-pub-images'),

  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: Joi.string().required().messages({
    'any.required': 'GOOGLE_CLIENT_ID is required for Google authentication',
  }),
  GOOGLE_CLIENT_SECRET: Joi.string().required().messages({
    'any.required':
      'GOOGLE_CLIENT_SECRET is required for Google authentication',
  }),
  GOOGLE_CALLBACK_URL: Joi.string().uri().required().messages({
    'any.required': 'GOOGLE_CALLBACK_URL is required for Google OAuth flow',
  }),

  // SMTP Configuration (for email service)
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().email().required(),

  // Redis Configuration (optional)
  REDIS_URL: Joi.string().uri().optional(),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),

  // Migration Mode
  MIGRATION_MODE: Joi.string().valid('true', 'false').optional(),
})
  .unknown(true) // Allow other environment variables
  .messages({
    'object.unknown': 'Unknown environment variable: {{#label}}',
  });

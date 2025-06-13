# Authentication Setup Documentation

This document provides comprehensive setup instructions for the NestJS authentication system with Google SSO integration, email verification, and cookie-based authentication.

## Overview

The authentication system includes:
- **Local Authentication**: Email/password registration and login with email verification
- **Google OAuth2**: Sign in with Google integration
- **JWT Tokens**: Secure token-based authentication using HTTP-only cookies
- **Email Verification**: Email confirmation required for new user registrations
- **Password Hashing**: Secure password storage using bcryptjs

## Prerequisites

1. Node.js (v18 or higher)
2. PostgreSQL database
3. Google Cloud Console project for OAuth2
4. SMTP email service (Gmail, SendGrid, etc.)

## Dependencies

The following packages have been installed:
```bash
pnpm install @nestjs/passport @nestjs/jwt passport passport-local passport-google-oauth20 passport-jwt bcryptjs class-validator class-transformer nodemailer handlebars cookie-parser
```

## Email Service Setup

### 1. Gmail SMTP Configuration
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → App passwords
   - Select "Mail" and generate a password
3. Use the generated password in your environment variables

### 2. Alternative SMTP Providers
- **SendGrid**: Professional email delivery service
- **Mailgun**: Reliable email API service
- **Amazon SES**: AWS Simple Email Service

## Google OAuth2 Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API

### 2. Create OAuth2 Credentials
1. Navigate to "Credentials" in the API & Services section
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

### 3. Update Environment Variables
Update your `.development.env` file with your Google OAuth2 and email credentials:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=The Pearson Pub
SMTP_FROM_EMAIL=your-email@gmail.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

## Database Migration

The User entity has been updated to support Google OAuth2. Make sure your database is updated with the new schema:

```typescript
// New fields added to User entity
@Column({ nullable: true })
google_id: string;

@Column({ nullable: true })
avatar_url: string;

@Column({ nullable: true }) // Made nullable for Google OAuth users
password_hash: string;
```

## API Endpoints

### Authentication Endpoints

#### 1. User Registration
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

**Response:**
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "first_name": "John",
    "is_verified": false,
    "is_active": true,
    "created_at": "2025-06-13T10:00:00Z"
  }
}
```

#### 2. Email Verification
```http
GET /auth/verify-email?token=<verification-token>
```

**Response:**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "first_name": "John",
    "is_verified": true
  }
}
```

#### 3. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "first_name": "John"
  }
}
```
*Note: JWT token is automatically set as an HTTP-only cookie*

#### 4. Google OAuth2 Login
```http
GET /auth/google
```
This endpoint redirects to Google for authentication.

#### 5. Google OAuth2 Callback
```http
GET /auth/google/callback
```
Google redirects here after authentication. The user is then redirected to your dashboard with authentication cookie set.

#### 6. Get User Profile (Protected Route)
```http
GET /auth/profile
```
*Note: Authentication is handled via HTTP-only cookies*

**Response:**
```json
{
  "userId": "uuid-here",
  "email": "user@example.com"
}
```

#### 7. Logout
```http
POST /auth/logout
```

**Response:**
```json
{
  "message": "Logout successful"
}
```
*Note: This clears the authentication cookie*

## Frontend Integration Examples

### JavaScript/TypeScript Frontend

#### Registration
```javascript
const signup = async (userData) => {
  try {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      credentials: 'include', // Important for cookies
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Show success message - user needs to verify email
      alert(result.message);
      // Redirect to verification page or login
      window.location.href = '/verify-email-sent';
    } else {
      console.error('Signup failed:', result.message);
    }
  } catch (error) {
    console.error('Signup error:', error);
  }
};
```

#### Email Verification Handler
```javascript
const verifyEmail = async (token) => {
  try {
    const response = await fetch(`/auth/verify-email?token=${token}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert(result.message);
      window.location.href = '/login';
    } else {
      console.error('Verification failed:', result.message);
    }
  } catch (error) {
    console.error('Verification error:', error);
  }
};
```

#### Login
```javascript
const login = async (credentials) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include', // Important for cookies
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Cookie is automatically set by the server
      window.location.href = '/dashboard';
    } else {
      console.error('Login failed:', result.message);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
};
```

#### Google Sign-In Button
```html
<a href="/auth/google" class="google-signin-btn">
  Sign in with Google
</a>
```

#### Making Authenticated Requests
```javascript
const getProfile = async () => {
  try {
    const response = await fetch('/auth/profile', {
      credentials: 'include', // Important for cookies
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('User profile:', profile);
    } else {
      // Cookie might be expired, redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
  }
};
```

#### Logout
```javascript
const logout = async () => {
  try {
    const response = await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (response.ok) {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

## Security Best Practices

1. **JWT Secret**: Use a strong, unique secret for JWT tokens in production
2. **Environment Variables**: Never commit sensitive credentials to version control
3. **HTTPS**: Always use HTTPS in production for secure cookie transmission
4. **HTTP-only Cookies**: Tokens are stored in HTTP-only cookies to prevent XSS attacks
5. **Token Expiration**: Tokens expire in 24 hours by default
6. **Password Hashing**: Passwords are hashed using bcryptjs with salt rounds of 10
7. **Email Verification**: Users must verify their email before logging in
8. **CORS Configuration**: Properly configured for frontend integration

## Testing the Authentication

### 1. Start the Application
```bash
pnpm run start:dev
```

### 2. Test Signup
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test User"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Test Protected Route
```bash
# No need to pass Authorization header - cookie is automatically included
curl -X GET http://localhost:3000/auth/profile \
  --cookie-jar cookies.txt --cookie cookies.txt
```

### 5. Test Email Verification
1. Register a new user with a valid email
2. Check your email for the verification link
3. Click the verification link or copy the token
4. Test the verification endpoint:
```bash
curl -X GET "http://localhost:3000/auth/verify-email?token=YOUR_VERIFICATION_TOKEN"
```

### 6. Test Google OAuth2
Open your browser and navigate to:
```
http://localhost:3000/auth/google
```

### 7. Test Logout
```bash
curl -X POST http://localhost:3000/auth/logout \
  --cookie-jar cookies.txt --cookie cookies.txt
```

## References

This implementation follows the official NestJS documentation:
- [Authentication Guide](https://docs.nestjs.com/security/authentication)
- [Passport Integration](https://docs.nestjs.com/recipes/passport)
- [Google Strategy](https://docs.nestjs.com/recipes/passport#google-strategy)

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **Google OAuth2**: Verify client ID, secret, and callback URL are properly configured
3. **JWT Errors**: Check that JWT_SECRET is set in environment variables
4. **Email Issues**: Verify SMTP credentials and check spam folder for verification emails
5. **Cookie Issues**: Ensure `credentials: 'include'` is set in frontend requests
6. **CORS Issues**: Configure CORS if accessing from different domains

### Error Messages

- `ConflictException`: User already exists - use different email
- `UnauthorizedException`: Invalid credentials or email not verified
- `BadRequestException`: Invalid or expired verification token
- `NotFoundException`: User not found - verify user exists

## Next Steps

Consider implementing:
1. ✅ **Email verification for new users** - COMPLETED
2. **Password reset functionality**
3. **Two-factor authentication (2FA)**
4. **Rate limiting for auth endpoints**
5. **Refresh token mechanism**
6. **Social login with other providers (Facebook, GitHub, etc.)**
7. **Account lockout after failed attempts**
8. **Email templates customization**

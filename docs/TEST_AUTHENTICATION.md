# Test Authentication System

This script demonstrates how to test all authentication endpoints.

## Prerequisites
- Start the application: `pnpm run start:dev`
- Ensure PostgreSQL is running
- Ensure SMTP credentials are configured

## Test Commands

### 1. Test User Registration
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    first_name = "Test"
    phone = "+1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/auth/signup" -Method POST -Body $body -ContentType "application/json"
```

### 2. Test Email Verification
After receiving the email, extract the token and test:
```powershell
$token = "YOUR_VERIFICATION_TOKEN_HERE"
Invoke-RestMethod -Uri "http://localhost:5000/auth/verify-email?token=$token" -Method GET
```

### 3. Test Login
```powershell
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -WebSession $session
```

### 4. Test Protected Route
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/auth/profile" -Method GET -WebSession $session
```

### 5. Test Logout
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/auth/logout" -Method POST -WebSession $session
```

## Using cURL (Alternative)

### Registration
```bash
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test User"
  }'
```

### Login with cookie support
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  --cookie-jar cookies.txt
```

### Access protected route
```bash
curl -X GET http://localhost:5000/auth/profile \
  --cookie cookies.txt
```

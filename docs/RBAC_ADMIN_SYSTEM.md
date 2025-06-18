# Role-Based Admin Management System

## Overview

This document describes the implementation of a role-based access control (RBAC) system for admin management in The Pearson Pub backend.

## Features

### 🔐 Role-Based Access Control
- **SuperAdmin**: Full system access, can invite/delete admins
- **Admin**: Limited access, cannot manage other admins

### 📧 Secure Admin Invitation System
- Cryptographically secure tokens with 1-hour expiry
- Email-based invitation workflow
- Single-use tokens to prevent replay attacks
- HTTPS-secured invitation links

### 🛡️ Security Features
- Role-based guards and decorators
- JWT tokens with role information
- Soft delete for admin accounts
- Prevention of self-deletion and unauthorized deletions

## Database Schema

### Admin Entity Updates
```sql
-- New role field added to admins table
ALTER TABLE admins ADD COLUMN role VARCHAR NOT NULL DEFAULT 'admin';
ALTER TABLE admins ADD CONSTRAINT admins_role_check CHECK (role IN ('admin', 'superadmin'));
```

### New Admin Invitations Table
```sql
CREATE TABLE admin_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    token_hash VARCHAR NOT NULL,
    role VARCHAR NOT NULL DEFAULT 'admin',
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    invited_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Invite Admin (SuperAdmin Only)
```http
POST /auth/invite-admin
Authorization: Bearer <superadmin-jwt-token>
Content-Type: application/json

{
  "email": "newadmin@example.com",
  "role": "admin" // optional, defaults to "admin"
}
```

**Response:**
```json
{
  "message": "Admin invitation sent successfully"
}
```

### 2. Validate Invitation Token
```http
POST /auth/validate-invitation
Content-Type: application/json

{
  "token": "secure-invitation-token"
}
```

**Response:**
```json
{
  "message": "Invitation token is valid",
  "invitation": {
    "email": "newadmin@example.com",
    "role": "admin"
  }
}
```

### 3. Setup Password (Complete Invitation)
```http
POST /auth/setup-password
Content-Type: application/json

{
  "token": "secure-invitation-token",
  "password": "newpassword123",
  "first_name": "John",
  "phone": "+1234567890",
  "address": "123 Main St"
}
```

**Response:**
```json
{
  "message": "Admin account created successfully! You can now log in.",
  "admin": {
    "id": "uuid-here",
    "email": "newadmin@example.com",
    "role": "admin",
    "is_verified": true
  }
}
```

### 4. Delete Admin (SuperAdmin Only)
```http
DELETE /auth/admin/:id
Authorization: Bearer <superadmin-jwt-token>
```

**Response:**
```json
{
  "message": "Admin account deactivated successfully"
}
```

### 5. List Admins (Admin & SuperAdmin)
```http
GET /admins
Authorization: Bearer <admin-or-superadmin-jwt-token>
```

**Response:**
```json
[
  {
    "id": "uuid-here",
    "email": "admin@example.com",
    "first_name": "John",
    "role": "admin",
    "is_verified": true,
    "is_active": true,
    "created_at": "2025-06-17T10:00:00Z"
  }
]
```

## Admin Invitation Workflow

1. **SuperAdmin Initiates Invitation**
   - SuperAdmin submits email and optional role
   - System generates cryptographically secure token
   - Token is hashed and stored with 1-hour expiry

2. **Email Sent**
   - Professional email template with role-specific information
   - Secure HTTPS link with token parameter
   - Clear expiry and security warnings

3. **Admin Receives Email**
   - Clicks secure link to frontend setup page
   - Frontend validates token via API

4. **Password Setup**
   - Admin fills password setup form
   - Frontend sends token + password to backend
   - Backend validates token and creates account

5. **Account Activation**
   - Token marked as used (prevents reuse)
   - Admin account created as verified
   - Admin can immediately log in

## Role-Based Permissions

### SuperAdmin Permissions
- ✅ Invite new admins
- ✅ Delete admin accounts
- ✅ View all admins
- ✅ Update admin information
- ✅ Access all system features

### Admin Permissions
- ❌ Cannot invite new admins
- ❌ Cannot delete admin accounts
- ✅ View admin list (read-only)
- ❌ Cannot update other admin information
- ✅ Access limited system features

### Protected Actions
- **Creating SuperAdmins**: Must be done manually in database or by existing SuperAdmin
- **Deleting SuperAdmins**: Only SuperAdmins can delete other SuperAdmins
- **Self-deletion**: Prevented for all roles
- **Role escalation**: Regular admins cannot upgrade their role

## Security Best Practices

### 🔒 Token Security
- Cryptographically secure random tokens (32 bytes)
- Tokens are hashed before storage (bcrypt)
- Short expiry time (1 hour)
- Single-use tokens

### 🛡️ Access Control
- Role-based guards on all sensitive endpoints
- JWT tokens include role information
- Automatic role validation on each request
- Soft delete instead of hard delete

### 📧 Email Security
- HTTPS-only invitation links
- Professional email templates
- Clear security warnings
- Sender authentication

### 🔐 Authentication Flow
- Pre-verified accounts for invited admins
- Role information in JWT payload
- Active admin validation on each request
- Secure cookie storage options

## Environment Variables

Add these to your `.env` file:

```env
# Frontend URL for invitation links (use HTTPS in production)
FRONTEND_URL=https://yourapp.com

# Email settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=The Pearson Pub
SMTP_FROM_EMAIL=noreply@yourapp.com

# JWT Secret (use strong secret in production)
JWT_SECRET=your-super-secret-jwt-key
```

## Error Handling

### Common Error Responses

```json
// Admin already exists
{
  "statusCode": 409,
  "message": "Admin with this email already exists"
}

// Invalid/expired token
{
  "statusCode": 400,
  "message": "Invalid or expired verification token"
}

// Insufficient permissions
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}

// Unauthorized access
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Testing the System

### 1. Create SuperAdmin (Manual Database Entry)
```sql
INSERT INTO admins (id, email, password_hash, role, is_verified, is_active) 
VALUES (
  gen_random_uuid(),
  'superadmin@example.com',
  '$2b$10$hashedpasswordhere',
  'superadmin',
  true,
  true
);
```

### 2. Login as SuperAdmin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@example.com", "password": "password123"}'
```

### 3. Invite New Admin
```bash
curl -X POST http://localhost:3000/auth/invite-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <superadmin-token>" \
  -d '{"email": "newadmin@example.com", "role": "admin"}'
```

### 4. Check Email and Complete Setup
- Check email inbox for invitation
- Click link to setup page
- Complete password setup form

## Migration Guide

To upgrade existing systems:

1. **Run Database Migration**
   ```sql
   -- Add role column to existing admins
   ALTER TABLE admins ADD COLUMN role VARCHAR DEFAULT 'admin';
   
   -- Update existing admin to superadmin if needed
   UPDATE admins SET role = 'superadmin' WHERE email = 'your-existing-admin@example.com';
   
   -- Create invitations table
   CREATE TABLE admin_invitations (...);
   ```

2. **Update Environment Variables**
   - Add FRONTEND_URL for invitation links
   - Ensure SMTP settings are configured

3. **Test the System**
   - Login as superadmin
   - Send test invitation
   - Complete invitation flow

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP credentials
   - Verify firewall/security settings
   - Check spam folder

2. **Token expired**
   - Tokens expire in 1 hour
   - Request new invitation if expired

3. **Permission denied**
   - Verify user role in database
   - Check JWT token validity
   - Ensure proper guards are applied

4. **Frontend integration**
   - Use HTTPS in production
   - Include credentials in requests
   - Handle error responses properly

## Future Enhancements

### Planned Features
- [ ] Email template customization
- [ ] Invitation resend functionality
- [ ] Admin activity logging
- [ ] Bulk admin invitation
- [ ] Role-based feature flags
- [ ] Two-factor authentication
- [ ] Session management improvements

### Security Improvements
- [ ] Rate limiting for invitations
- [ ] IP-based restrictions
- [ ] Admin approval workflow
- [ ] Audit trail for admin actions
- [ ] Password policy enforcement

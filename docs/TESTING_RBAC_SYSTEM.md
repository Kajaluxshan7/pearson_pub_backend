# Testing the Role-Based Admin System

## Quick Start Guide

### 1. Create First SuperAdmin

Since the system requires a SuperAdmin to invite other admins, you need to create the first SuperAdmin manually.

#### Option A: Database Insert (Recommended)
```sql
-- Connect to your PostgreSQL database and run:
INSERT INTO admins (
    id, 
    email, 
    password_hash, 
    role, 
    first_name,
    is_verified, 
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'superadmin@pearsonpub.com',
    '$2b$10$KQhkOGqvXyHdCsBFl/xN3eFSrA6Hgr4Z8vJ9lO2mW3pXrN4kY5sGa', -- password: 'superadmin123'
    'superadmin',
    'Super Admin',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
```

#### Option B: Using bcrypt to generate password hash
```javascript
// In Node.js console or create a script:
const bcrypt = require('bcryptjs');
const password = 'your-secure-password';
const hash = bcrypt.hashSync(password, 10);
console.log('Password hash:', hash);
// Use this hash in the SQL insert above
```

### 2. Test Authentication Endpoints

#### Login as SuperAdmin
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@pearsonpub.com",
    "password": "superadmin123"
  }' \
  -c cookies.txt
```

#### Invite New Admin
```bash
curl -X POST http://localhost:3000/auth/invite-admin \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "admin@pearsonpub.com",
    "role": "admin"
  }'
```

#### List All Admins
```bash
curl -X GET http://localhost:3000/admins \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

### 3. Test Invitation Flow

1. **Send Invitation** (as SuperAdmin)
2. **Check Email** for invitation link
3. **Validate Token**:
```bash
curl -X POST http://localhost:3000/auth/validate-invitation \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-invitation-token-from-email"
  }'
```

4. **Setup Password**:
```bash
curl -X POST http://localhost:3000/auth/setup-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-invitation-token-from-email",
    "password": "newadmin123",
    "first_name": "New Admin"
  }'
```

### 4. Test Role-Based Access

#### Try Admin Operations (Should Fail for Regular Admin)
```bash
# Login as regular admin first
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pearsonpub.com",
    "password": "newadmin123"
  }' \
  -c admin_cookies.txt

# Try to invite another admin (should fail with 403)
curl -X POST http://localhost:3000/auth/invite-admin \
  -H "Content-Type: application/json" \
  -b admin_cookies.txt \
  -d '{
    "email": "another@pearsonpub.com",
    "role": "admin"
  }'
```

### 5. Environment Setup

Make sure your `.env` file has these settings:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_DATABASE=pearson_pub

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email (Configure with your SMTP provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=The Pearson Pub
SMTP_FROM_EMAIL=noreply@pearsonpub.com

# Frontend (for invitation links)
FRONTEND_URL=http://localhost:3000
```

### 6. Frontend Integration Example

#### Invitation Setup Page (React/Next.js example)
```javascript
// pages/admin/setup-password.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SetupPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    password: '',
    first_name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch('/api/auth/validate-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const data = await response.json();
        setInvitation(data.invitation);
      } else {
        alert('Invalid or expired invitation token');
        router.push('/');
      }
    } catch (error) {
      console.error('Error validating token:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...formData })
      });
      
      if (response.ok) {
        alert('Account setup successful! You can now log in.');
        router.push('/login');
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      console.error('Error setting up password:', error);
    }
  };

  if (!invitation) return <div>Loading...</div>;

  return (
    <div className="setup-password-form">
      <h1>Setup Your Admin Account</h1>
      <p>Welcome! You've been invited as an {invitation.role}.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({...formData, first_name: e.target.value})}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
        <textarea
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}
```

### 7. Common Issues & Solutions

#### Issue: Email not sending
**Solution**: 
- Check SMTP credentials
- Enable "Less secure app access" for Gmail
- Use App Passwords for Gmail with 2FA

#### Issue: Token validation fails
**Solution**:
- Check token hasn't expired (1 hour limit)
- Verify token wasn't already used
- Check database connection

#### Issue: Permission denied
**Solution**:
- Verify user role in database
- Check JWT token includes role information
- Ensure guards are properly applied

#### Issue: CORS errors in frontend
**Solution**:
- Configure CORS in main.ts
- Include credentials in fetch requests
- Use proper frontend URL in environment

### 8. Security Checklist

- [ ] ✅ Use HTTPS in production
- [ ] ✅ Secure JWT secret (min 256 bits)
- [ ] ✅ Configure proper SMTP authentication
- [ ] ✅ Set secure cookie options in production
- [ ] ✅ Implement rate limiting for invitation endpoints
- [ ] ✅ Regular security audits of admin accounts
- [ ] ✅ Monitor failed login attempts
- [ ] ✅ Backup and secure database access

### 9. Production Deployment Notes

1. **Environment Variables**: Use secure environment variable management
2. **Database**: Ensure proper indexing on email and role columns
3. **Email Service**: Use professional email service (SendGrid, AWS SES)
4. **Monitoring**: Set up logging for admin actions
5. **Backup**: Regular database backups including admin_invitations table

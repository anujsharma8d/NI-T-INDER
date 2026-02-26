# OTP Email Verification System

## Overview
The registration process now requires email verification using a One-Time Password (OTP) sent to the user's NITJ email address.

## How It Works

### Registration Flow
1. User enters their details (name, email, password)
2. System validates NITJ email format (`name.branch.year@nitj.ac.in`)
3. System sends a 6-digit OTP to the email
4. User enters the OTP to verify their email
5. Upon successful verification, account is created

### Features
- **6-digit OTP**: Random numeric code
- **10-minute expiration**: OTP expires after 10 minutes
- **Rate limiting**: Maximum 5 verification attempts per OTP
- **Resend functionality**: Users can request a new OTP after 60 seconds
- **Email validation**: Only NITJ student emails are accepted

## API Endpoints

### 1. Send OTP
```
POST /auth/send-otp
```

**Request Body:**
```json
{
  "email": "john.cse.22@nitj.ac.in"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email",
  "expiresIn": 600
}
```

### 2. Verify OTP & Register
```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "email": "john.cse.22@nitj.ac.in",
  "otp": "123456",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "Registered user: John Doe",
  "token": "jwt-token-here"
}
```

## Email Configuration

### Development Mode
If no SMTP credentials are configured, the system runs in development mode and logs OTP codes to the console instead of sending emails.

### Production Mode (Gmail Example)
Add these environment variables to your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="NITinder <noreply@nitinder.com>"
```

**Important for Gmail:**
- You must use an App Password, not your regular Gmail password
- Enable 2-Factor Authentication on your Google account
- Generate an App Password: https://myaccount.google.com/apppasswords

### Other Email Providers
You can use any SMTP provider (SendGrid, Mailgun, AWS SES, etc.) by configuring the appropriate SMTP settings.

## Database Schema

### email_otps Table
```sql
CREATE TABLE email_otps(
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  otp_code        TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  expires_at      TEXT NOT NULL,
  verified_at     TEXT,
  attempts        INTEGER DEFAULT 0
)
```

## Security Features

1. **Email Format Validation**: Only NITJ emails accepted
2. **OTP Expiration**: 10-minute validity
3. **Attempt Limiting**: Max 5 failed attempts
4. **One-time Use**: OTP marked as verified after successful use
5. **Automatic Cleanup**: Old OTPs deleted when new one is requested

## Frontend Implementation

The Register component now has two steps:
1. **Step 1**: Enter registration details and request OTP
2. **Step 2**: Enter OTP code to verify and complete registration

Features:
- Countdown timer for resend (60 seconds)
- Back button to change email
- Clear error messages
- Auto-focus on OTP input

## Testing

### Development Testing
1. Start the server without SMTP configuration
2. Register with a NITJ email
3. Check the console logs for the OTP code
4. Use the logged OTP to complete registration

### Production Testing
1. Configure SMTP credentials
2. Register with your actual NITJ email
3. Check your inbox for the OTP email
4. Complete registration with the received OTP

## Error Handling

Common error messages:
- "only NITJ student emails are allowed"
- "user already exists with this email"
- "no OTP found for this email"
- "OTP has expired. Please request a new one"
- "too many failed attempts. Please request a new OTP"
- "invalid OTP code"

## Future Enhancements

Potential improvements:
- SMS OTP as alternative
- Email verification link (magic link)
- Remember device functionality
- OTP cleanup job for expired entries
- Rate limiting on OTP requests per IP

# Email Verification Setup

## Overview

Email verification has been added to the ARC Raiders Companion registration process. Users must verify their email address before they can log in and use the application.

## How It Works

1. **Registration**: When a user registers, they provide an email, username, and password
2. **Verification Email**: A verification email is sent to the provided email address with a unique verification link
3. **Email Verification**: User clicks the link in the email to verify their account
4. **Account Activation**: Once verified, the user's account is activated and they can log in
5. **Login**: Only verified users can log in to the application

## Database Changes

The following fields have been added to the `users` table:

- `email_verified` (BOOLEAN, default: false) - Indicates if the email has been verified
- `verification_token` (VARCHAR(255)) - Unique token for email verification
- `verification_token_expires` (TIMESTAMP) - Expiration time for the verification token (24 hours)

**Migration**: Run `node server/run-migration.js --verify-existing` to add these fields and mark existing users as verified.

## Email Service Configuration

### Development Mode (Default)

In development, emails are logged to the console instead of being sent. You'll see the verification link in the terminal output.

### Production Mode

To enable actual email sending in production, configure the following environment variables in `server/.env`:

```env
NODE_ENV=production

# Email SMTP Configuration
EMAIL_HOST=smtp.gmail.com              # Your SMTP server
EMAIL_PORT=587                         # SMTP port (587 for TLS, 465 for SSL)
EMAIL_SECURE=false                     # true for 465, false for other ports
EMAIL_USER=your-email@gmail.com        # Your email account
EMAIL_PASSWORD=your-app-password       # App password (not regular password)
EMAIL_FROM="ARC Raiders Companion <noreply@arcraiders.com>"

# Frontend URL (for verification links)
FRONTEND_URL=https://your-domain.com
```

### Email Provider Setup Examples

#### Gmail

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_PASSWORD`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

#### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

#### AWS SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
```

## API Endpoints

### POST /api/auth/register

Register a new user and send verification email.

**Request:**
```json
{
  "email": "user@example.com",
  "username": "raider123",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "raider123",
    "emailVerified": false
  }
}
```

### GET /api/auth/verify-email/:token

Verify email with the token from the verification link.

**Response:**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "verified": true
}
```

### POST /api/auth/resend-verification

Resend verification email to a user.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent! Please check your inbox.",
  "sent": true
}
```

### POST /api/auth/login

Login (only allowed for verified users).

**Error Response (if not verified):**
```json
{
  "error": "Please verify your email address before logging in. Check your email for the verification link."
}
```

## Frontend Components

### VerifyEmailPage

- Displayed when user clicks the verification link
- Shows verification status (loading, success, or error)
- Automatically redirects to login after successful verification

### LoginPage Updates

- Shows success message after registration
- Displays error if user tries to log in without verification
- Provides "Resend Verification Email" button if verification is needed

## Testing

### Development Testing

1. Start the server: `npm run dev:server`
2. Start the frontend: `npm run dev`
3. Register a new account
4. Check the server console for the verification link
5. Copy the link and paste it in your browser
6. Verify the account is activated

### Production Testing

1. Configure email settings in `.env`
2. Register with a real email address
3. Check your inbox for the verification email
4. Click the link to verify
5. Log in with your credentials

## Security Features

- Verification tokens are cryptographically secure (32 random bytes)
- Tokens expire after 24 hours
- Tokens are cleared after successful verification
- Users cannot log in until email is verified
- Existing users are automatically marked as verified during migration

## Troubleshooting

### "Verification token has expired"

- Token is valid for 24 hours
- Solution: Use the "Resend Verification Email" button on the login page

### "Email already verified"

- Account is already activated
- Solution: Log in normally

### Emails not sending in production

- Check `NODE_ENV` is set to `production`
- Verify email credentials in `.env`
- Check SMTP server settings
- Review server logs for error messages

### Gmail "Less secure app access" error

- Gmail requires App Passwords (not your regular password)
- Enable 2FA and generate an App Password
- Use the 16-character app password in `EMAIL_PASSWORD`

## Future Enhancements

Potential improvements:

- Password reset via email
- Email change verification
- Welcome email with getting started guide
- Email preferences/notifications
- Rate limiting for verification email resends

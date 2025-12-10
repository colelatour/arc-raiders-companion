# Production Deployment Guide - Email Verification

## 🚀 Making Email Verification Work in Production

This guide will help you configure real email sending when you deploy your ARC Raiders Companion app.

---

## Option 1: Gmail (Easiest for Personal Projects)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** → **2-Step Verification**
3. Follow the steps to enable 2FA

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** and your device
3. Click **Generate**
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Configure Environment Variables

In your **production** `server/.env` file:

```env
NODE_ENV=production

# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # The 16-char app password (no spaces)
EMAIL_FROM="ARC Raiders Companion <your-email@gmail.com>"

# Your production frontend URL
FRONTEND_URL=https://your-domain.com
```

**Important Notes:**
- Use the **App Password**, NOT your regular Gmail password
- Remove spaces from the app password
- Update `FRONTEND_URL` to your actual domain
- Gmail has a limit of ~500 emails/day

---

## Option 2: SendGrid (Recommended for Production)

SendGrid is free for up to 100 emails/day and designed for transactional emails.

### Step 1: Create SendGrid Account
1. Go to: https://sendgrid.com
2. Sign up for a free account
3. Verify your email address

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it (e.g., "ARC Raiders Emails")
4. Select **Full Access** or **Restricted Access** (with Mail Send permissions)
5. Copy the API key (starts with `SG.`)

### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email and details
4. Check your email and click the verification link

### Step 4: Configure Environment Variables

```env
NODE_ENV=production

# SendGrid SMTP Configuration
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key-here
EMAIL_FROM="ARC Raiders Companion <verified-sender@yourdomain.com>"

FRONTEND_URL=https://your-domain.com
```

**Important Notes:**
- The `EMAIL_USER` is literally the word `apikey`
- Use the API key as the password
- `EMAIL_FROM` must match your verified sender
- Free tier: 100 emails/day

---

## Option 3: AWS SES (Scalable for Large Apps)

Amazon Simple Email Service is extremely cheap and scalable.

### Step 1: Set Up AWS SES
1. Sign in to AWS Console: https://console.aws.amazon.com
2. Go to **Amazon SES**
3. Click **Verify a New Email Address**
4. Verify your sender email

### Step 2: Create SMTP Credentials
1. In SES Console, go to **SMTP Settings**
2. Click **Create My SMTP Credentials**
3. Download and save the credentials

### Step 3: Move Out of Sandbox (Optional)
By default, SES is in "sandbox mode" (can only send to verified emails).

1. Go to **Account Dashboard**
2. Click **Request Production Access**
3. Fill out the form explaining your use case
4. Wait for approval (usually 24-48 hours)

### Step 4: Configure Environment Variables

```env
NODE_ENV=production

# AWS SES Configuration
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com  # Use your region
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM="ARC Raiders Companion <verified@yourdomain.com>"

FRONTEND_URL=https://your-domain.com
```

**Pricing:**
- First 62,000 emails/month: FREE (if sent from EC2)
- $0.10 per 1,000 emails after that

---

## Option 4: Mailgun

Another popular service with good free tier.

### Setup
1. Sign up at: https://www.mailgun.com
2. Verify your domain or use their sandbox domain
3. Get SMTP credentials from **Sending** → **Domain Settings**

```env
NODE_ENV=production

EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
EMAIL_FROM="ARC Raiders Companion <noreply@your-domain.com>"

FRONTEND_URL=https://your-domain.com
```

**Free Tier:** 5,000 emails/month for 3 months

---

## Deployment Checklist

### 1. Update Frontend URL
Make sure `FRONTEND_URL` in `server/.env` points to your production domain:
```env
FRONTEND_URL=https://your-app.com
```

This ensures verification links point to the right place.

### 2. Update VITE_API_URL
In your frontend `.env` file:
```env
VITE_API_URL=https://your-api.com/api
```

### 3. Set NODE_ENV
```env
NODE_ENV=production
```

This switches from console logging to actual email sending.

### 4. Secure Your Secrets
- **NEVER** commit `.env` files to Git
- Add `.env` to `.gitignore` (it should already be there)
- Use environment variables in your hosting platform

### 5. Test Before Going Live
```bash
# Test with a real email address
cd server
node -e "
import('./utils/emailService.js').then(async (service) => {
  const token = 'test-token-123';
  const result = await service.sendVerificationEmail(
    'your-test-email@gmail.com',
    'TestUser',
    token
  );
  console.log('Email sent:', result);
  process.exit(0);
});
"
```

---

## Hosting Platform Configuration

### Vercel / Netlify (Serverless)
Add environment variables in the dashboard:
- Go to **Settings** → **Environment Variables**
- Add all the `EMAIL_*` variables
- Redeploy

### Heroku
```bash
heroku config:set NODE_ENV=production
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_SECURE=false
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set EMAIL_FROM="ARC Raiders <noreply@arcraiders.com>"
heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
```

### AWS / DigitalOcean / VPS
1. SSH into your server
2. Create or edit `.env` file in the server directory
3. Add all EMAIL_* variables
4. Restart your Node.js server

### Docker
Add to your `docker-compose.yml`:
```yaml
services:
  server:
    environment:
      - NODE_ENV=production
      - EMAIL_HOST=${EMAIL_HOST}
      - EMAIL_PORT=${EMAIL_PORT}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASSWORD=${EMAIL_PASSWORD}
      - EMAIL_FROM=${EMAIL_FROM}
      - FRONTEND_URL=${FRONTEND_URL}
```

---

## Testing in Production

### 1. Register a Test Account
Use a real email address you can access.

### 2. Check Your Inbox
- Look in Inbox and Spam folder
- Verification email should arrive within seconds

### 3. Click Verification Link
Should redirect to your production domain with the verification page.

### 4. Verify Logs
Check your server logs to confirm emails are being sent:
```bash
# Heroku
heroku logs --tail

# Your server
pm2 logs
# or
journalctl -u your-app -f
```

---

## Troubleshooting

### Emails Not Sending

**Check 1: Environment Variables**
```bash
# On your server, verify env vars are set
echo $EMAIL_HOST
echo $EMAIL_USER
# etc.
```

**Check 2: NODE_ENV**
Must be set to `production` for emails to send:
```bash
echo $NODE_ENV
```

**Check 3: Firewall**
Make sure port 587 (SMTP) is not blocked:
```bash
telnet smtp.gmail.com 587
```

**Check 4: Server Logs**
Look for email sending errors:
```bash
# Check for errors like:
# "Failed to send verification email: [error]"
```

### Emails Going to Spam

**Fix 1: Use a Custom Domain**
Instead of `noreply@gmail.com`, use `noreply@yourdomain.com`

**Fix 2: Set Up SPF/DKIM Records**
If using SendGrid/AWS SES, they provide DNS records to add.

**Fix 3: Warm Up Your Sender**
Start by sending a few emails, gradually increase volume.

### Rate Limiting

**Gmail:** 500/day limit
- **Solution:** Switch to SendGrid or AWS SES

**SendGrid Free:** 100/day limit
- **Solution:** Upgrade to paid plan ($15/month for 40k emails)

---

## Security Best Practices

### 1. Use App Passwords (Gmail)
Never use your main Gmail password.

### 2. Rotate Credentials
Change API keys/passwords periodically.

### 3. Monitor Usage
Check your email service dashboard for unusual activity.

### 4. Rate Limit Registrations
Prevent abuse by limiting registrations per IP:
```javascript
// Add to server.js
import rateLimit from 'express-rate-limit';

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 registrations per IP
  message: 'Too many accounts created. Please try again later.'
});

app.use('/api/auth/register', registerLimiter);
```

### 5. Verify Email Ownership
The current implementation already does this with verification links.

---

## Cost Estimation

### Small App (< 100 users/day)
- **Gmail:** FREE (if under 500/day)
- **SendGrid:** FREE (100/day)
- **Mailgun:** FREE (5k/month for 3 months)
- **AWS SES:** FREE (if on EC2)

### Medium App (100-1000 users/day)
- **SendGrid:** $15/month (40k emails)
- **AWS SES:** ~$1-5/month
- **Mailgun:** $35/month (50k emails)

### Large App (1000+ users/day)
- **AWS SES:** ~$10-50/month (very scalable)
- **SendGrid:** Custom pricing

---

## Quick Start: Gmail Setup (5 Minutes)

```bash
# 1. Enable 2FA on Google Account
# 2. Generate App Password
# 3. Update server/.env

nano server/.env

# Add these lines:
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=yourname@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM="ARC Raiders <yourname@gmail.com>"
FRONTEND_URL=https://your-domain.com

# 4. Restart server
pm2 restart all
# or
npm run start

# 5. Test by registering a new account
```

---

## Recommended Setup

**For Development/Personal Projects:**
→ Use **Gmail** (free, easy setup)

**For Production Apps:**
→ Use **SendGrid** (reliable, good free tier, professional)

**For High-Volume Apps:**
→ Use **AWS SES** (cheap, infinitely scalable)

---

## Support Resources

- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
- **SendGrid Docs:** https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api
- **AWS SES Guide:** https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html
- **Nodemailer Docs:** https://nodemailer.com/about/

---

**Need help?** Check the troubleshooting section or refer to `docs/EMAIL_VERIFICATION.md` for more details.

# Production Deployment Guide - ARC Raiders Companion

## 🚀 Complete Step-by-Step Guide to Deploy Your App

This guide covers everything you need to deploy your ARC Raiders Companion app with full email verification functionality.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Email Service Setup](#email-service-setup)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Final Configuration](#final-configuration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before you deploy, make sure you have:

- [ ] A domain name (e.g., `arcraiders.com`)
- [ ] A hosting provider account (Heroku, Vercel, DigitalOcean, AWS, etc.)
- [ ] PostgreSQL database (provided by hosting or separate service)
- [ ] Email service account (Gmail, SendGrid, or AWS SES)
- [ ] Git repository set up
- [ ] All code committed and pushed

---

## Email Service Setup

### Option A: Gmail (Easiest - 5 Minutes)

**Best for:** Personal projects, small user base (< 500 emails/day)

#### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click **2-Step Verification**
3. Follow the setup process

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. In "Select app" dropdown, choose **Mail**
3. In "Select device" dropdown, choose your device or **Other (Custom name)**
4. Type "ARC Raiders App"
5. Click **Generate**
6. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)
7. **Remove all spaces** → `xxxxxxxxxxxxxxxx`

#### Step 3: Save These Credentials
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxxxxxxxxxxxxxx  (the 16-char password, no spaces)
EMAIL_FROM="ARC Raiders Companion <your-email@gmail.com>"
```

**Limitations:**
- 500 emails per day limit
- Personal email in "From" field

---

### Option B: SendGrid (Recommended for Production)

**Best for:** Professional apps, better deliverability, 100 emails/day free

#### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com
2. Click **Start for Free**
3. Create account and verify your email

#### Step 2: Create API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name: "ARC Raiders Production"
5. Permissions: **Full Access** (or Restricted with Mail Send)
6. Click **Create & View**
7. **Copy the API key** (starts with `SG.`)
   - ⚠️ You can only see this ONCE! Save it now!

#### Step 3: Verify Sender Identity
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - From Name: `ARC Raiders Companion`
   - From Email: Your email
   - Reply To: Same email
   - Address, City, Country: Required fields
4. Click **Create**
5. Check your email and click the verification link

#### Step 4: Save These Credentials
```
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key-here
EMAIL_FROM="ARC Raiders Companion <verified-email@yourdomain.com>"
```

**Benefits:**
- Professional email service
- Better spam handling
- 100 emails/day free
- Email analytics
- Custom "From" name

---

### Option C: AWS SES (For High Volume)

**Best for:** Large scale, cheapest option for high volume

See `docs/PRODUCTION_EMAIL_SETUP.md` for detailed AWS SES setup.

**Quick summary:**
- Free for first 62,000 emails/month (if sent from EC2)
- $0.10 per 1,000 emails after that
- Requires AWS account
- More complex setup

---

## Database Setup

Your app uses PostgreSQL. Most hosting providers offer it.

### Option 1: Heroku Postgres (Easiest)

```bash
# Heroku automatically provides PostgreSQL
# After creating Heroku app:
heroku addons:create heroku-postgresql:essential-0
```

Heroku will automatically set `DATABASE_URL` for you.

### Option 2: Railway

Railway automatically provides PostgreSQL when you deploy.

### Option 3: AWS RDS (PostgreSQL)

**Best for:** Production apps, full control, scalable

#### Step 1: Create RDS Instance
1. Log in to AWS Console: https://console.aws.amazon.com
2. Go to **RDS** service
3. Click **Create database**
4. Choose **Standard create**
5. Engine: **PostgreSQL** (latest version recommended)
6. Templates: 
   - **Free tier** (for testing)
   - **Production** (for live app)

#### Step 2: Configure Settings
- **DB instance identifier:** `arc-raiders-db`
- **Master username:** `postgres` (or your choice)
- **Master password:** Create a strong password
- **DB instance class:** 
  - Free tier: `db.t3.micro`
  - Production: `db.t3.small` or larger
- **Storage:** 20 GB minimum
- **Public access:** **Yes** (if connecting from external servers)
- **VPC security group:** Create new (allow PostgreSQL port 5432)

#### Step 3: Wait for Creation
This takes 5-10 minutes. AWS will show status as "Available" when ready.

#### Step 4: Get Connection Details
1. Click on your database instance
2. Under **Connectivity & security**, find:
   - **Endpoint:** `arc-raiders-db.xxxxx.us-east-1.rds.amazonaws.com`
   - **Port:** `5432`
3. Build your `DATABASE_URL`:
   ```
   postgresql://postgres:your-password@arc-raiders-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres
   ```

#### Step 5: Configure Security Group
1. Click **VPC security groups** link
2. Click **Inbound rules** tab
3. Edit inbound rules:
   - Type: **PostgreSQL**
   - Port: **5432**
   - Source: **0.0.0.0/0** (for development) or your server IPs (for production)
4. Save rules

#### Step 6: Test Connection
```bash
# Test locally first
export DATABASE_URL="postgresql://postgres:password@your-rds-endpoint:5432/postgres"
psql $DATABASE_URL -c "SELECT version();"
```

#### Step 7: Initialize Database
```bash
# Using the schema file
psql $DATABASE_URL -f database-schema.sql
```

**AWS RDS Benefits:**
- Full PostgreSQL features
- Automated backups
- Easy scaling
- High availability options
- $15-50/month (depending on size)

### Option 4: Separate Database (Render, Neon, Supabase)

1. Create database on chosen provider
2. Get connection string (format: `postgresql://user:password@host:port/database`)
3. Save as `DATABASE_URL` environment variable

### Database Migration

After database is created, you need to initialize it:

```bash
# Option A: Using the schema file
psql $DATABASE_URL -f database-schema.sql

# Option B: Using migration script (if you have existing users)
node server/run-migration.js --verify-existing
```

**Important:** The migration script marks existing users as verified so they can still log in.

### Database Connection Format

Your app supports two connection methods:

**Method 1: DATABASE_URL (Recommended for Production)**
```bash
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
```

**Method 2: Individual Variables (Local Development)**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=arcraiders
DB_USER=postgres
DB_PASSWORD=your_password
```

If `DATABASE_URL` is set, it takes priority over individual variables.

---

## Backend Deployment

### Option 1: Heroku (Recommended - Easiest)

#### Step 1: Install Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

#### Step 2: Login and Create App
```bash
heroku login
heroku create your-app-name
```

#### Step 3: Set Environment Variables
```bash
# Required
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)

# Email (Gmail example)
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_SECURE=false
heroku config:set EMAIL_USER=your-email@gmail.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set EMAIL_FROM="ARC Raiders <your-email@gmail.com>"

# Frontend URL (you'll update this after frontend is deployed)
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
```

#### Step 4: Create Procfile
Create `Procfile` in your server directory:
```
web: cd server && node server.js
```

#### Step 5: Deploy
```bash
git add .
git commit -m "Add Procfile for Heroku"
git push heroku main
```

#### Step 6: Initialize Database
```bash
heroku run bash
# Inside Heroku terminal:
cd server
node run-migration.js --verify-existing
exit
```

#### Step 7: Get Your Backend URL
```bash
heroku info
# Look for "Web URL" - that's your backend URL
# Example: https://your-app-name.herokuapp.com
```

---

### Option 2: Railway

1. Go to https://railway.app
2. Click **Start a New Project**
3. Connect your GitHub repository
4. Railway automatically detects Node.js
5. Add environment variables in the Railway dashboard
6. Deploy happens automatically

---

### Option 3: Render

1. Go to https://render.com
2. Create **New Web Service**
3. Connect repository
4. Build Command: `cd server && npm install`
5. Start Command: `cd server && node server.js`
6. Add environment variables
7. Click **Create Web Service**

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login and Deploy
```bash
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Choose your account
- Link to existing project? **N**
- Project name? **arc-raiders-companion**
- In which directory? **./** (root)
- Override settings? **N**

#### Step 3: Set Environment Variables
```bash
# Set production API URL (from your backend deployment)
vercel env add VITE_API_URL production

# When prompted, enter:
https://your-backend-url.herokuapp.com/api
```

Or in Vercel dashboard:
1. Go to your project
2. **Settings** → **Environment Variables**
3. Add: `VITE_API_URL` = `https://your-backend-url.herokuapp.com/api`
4. Click **Save**

#### Step 4: Deploy to Production
```bash
vercel --prod
```

#### Step 5: Get Your Frontend URL
Vercel will show you the production URL, like:
```
https://arc-raiders-companion.vercel.app
```

---

### Option 2: Netlify

1. Go to https://netlify.com
2. Click **Add new site** → **Import an existing project**
3. Connect to GitHub
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url/api`
6. Click **Deploy**

---

## Final Configuration

### Step 1: Update Backend with Frontend URL

Now that you know your frontend URL, update the backend:

**Heroku:**
```bash
heroku config:set FRONTEND_URL=https://your-frontend-url.vercel.app
```

**Other platforms:** Update the `FRONTEND_URL` environment variable in your hosting dashboard.

### Step 2: Update Frontend with Backend URL

Make sure your frontend `.env` or environment variables have:
```
VITE_API_URL=https://your-backend-url.herokuapp.com/api
```

### Step 3: Update CORS Settings

Your server's CORS is already set up to use `process.env.FRONTEND_URL` in production, so this should work automatically once you set the environment variable.

### Step 4: Redeploy if Needed

**Backend:**
```bash
# Heroku
git push heroku main

# Railway/Render
git push origin main  (auto-deploys)
```

**Frontend:**
```bash
# Vercel
vercel --prod

# Netlify
git push origin main  (auto-deploys)
```

---

## Testing

### Test Email Verification

1. Go to your production frontend URL
2. Click **Register**
3. Create a new account with a REAL email address you can access
4. Check your email inbox (and spam folder)
5. Click the verification link
6. You should see "Email Verified!" message
7. Log in with your new account
8. ✅ Success!

### Test Full Flow

- [ ] Registration sends email
- [ ] Verification link works
- [ ] Verified user can log in
- [ ] Unverified user is blocked
- [ ] Resend verification works
- [ ] All app features work after login

---

## Environment Variables Summary

### Backend (Server)

| Variable | Example | Required |
|----------|---------|----------|
| `NODE_ENV` | `production` | ✅ Yes |
| `DATABASE_URL` | `postgresql://...` | ✅ Yes (auto-set by host) |
| `JWT_SECRET` | `random-string-32-chars` | ✅ Yes |
| `EMAIL_HOST` | `smtp.gmail.com` | ✅ Yes |
| `EMAIL_PORT` | `587` | ✅ Yes |
| `EMAIL_SECURE` | `false` | ✅ Yes |
| `EMAIL_USER` | `your@email.com` | ✅ Yes |
| `EMAIL_PASSWORD` | `your-app-password` | ✅ Yes |
| `EMAIL_FROM` | `"ARC Raiders <noreply@example.com>"` | ✅ Yes |
| `FRONTEND_URL` | `https://yourapp.vercel.app` | ✅ Yes |
| `PORT` | `5001` | No (auto-set) |

### Frontend

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_API_URL` | `https://yourapi.herokuapp.com/api` | ✅ Yes |

---

## Troubleshooting

### Emails Not Sending

**Problem:** Users register but don't receive emails

**Solutions:**
1. Check `NODE_ENV=production` is set
2. Verify email credentials in environment variables
3. Check hosting logs for email errors
4. Test email service credentials locally first
5. Check spam folder
6. For Gmail: Make sure you're using App Password, not regular password

**Test email manually:**
```bash
heroku run bash
node -e "
import('./server/utils/emailService.js').then(async (service) => {
  await service.sendVerificationEmail('your@email.com', 'Test', 'test-token-123');
  console.log('Email sent!');
  process.exit(0);
});
"
```

### CORS Errors

**Problem:** Frontend can't connect to backend

**Solutions:**
1. Make sure `FRONTEND_URL` is set correctly on backend
2. Check that frontend URL matches exactly (no trailing slash)
3. Verify CORS settings in `server.js`
4. Check browser console for exact error

### Database Connection Failed

**Problem:** Backend can't connect to database

**Solutions:**
1. Verify `DATABASE_URL` is set
2. Check database is running
3. Run migrations: `heroku run node server/run-migration.js`
4. Check hosting provider database status

### Verification Links Don't Work

**Problem:** Clicking verification link shows error

**Solutions:**
1. Make sure `FRONTEND_URL` is correct on backend
2. Verify route exists: `/verify-email` in frontend
3. Check token hasn't expired (24 hours)
4. Look at browser console for errors
5. Check backend logs

### Build Failures

**Problem:** Deployment fails during build

**Solutions:**
1. Test build locally: `npm run build`
2. Check all dependencies are in `package.json`
3. Verify Node.js version compatibility
4. Check build logs for specific error
5. Make sure `.env` files aren't committed (they shouldn't be)

---

## Security Checklist

Before going live:

- [ ] Change default admin password
- [ ] `JWT_SECRET` is a strong random string (32+ characters)
- [ ] Email credentials use App Passwords (not main password)
- [ ] `.env` files are in `.gitignore`
- [ ] No sensitive data in Git repository
- [ ] HTTPS enabled on both frontend and backend
- [ ] Database has strong password
- [ ] CORS restricted to your frontend domain only
- [ ] Rate limiting enabled (optional but recommended)

---

## Quick Reference: Full Deployment Flow

```bash
# 1. Setup Email Service
# → Get SMTP credentials from Gmail/SendGrid

# 2. Deploy Backend (Heroku example)
heroku create my-arc-backend
heroku addons:create heroku-postgresql:essential-0
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=your@email.com
heroku config:set EMAIL_PASSWORD=your-app-password
heroku config:set EMAIL_FROM="ARC Raiders <your@email.com>"
git push heroku main

# 3. Initialize Database
heroku run node server/run-migration.js --verify-existing

# 4. Deploy Frontend (Vercel example)
vercel
vercel env add VITE_API_URL production
# Enter: https://my-arc-backend.herokuapp.com/api
vercel --prod

# 5. Update Backend with Frontend URL
heroku config:set FRONTEND_URL=https://my-arc-frontend.vercel.app

# 6. Test!
# Go to your frontend URL and register a new account
```

---

## Cost Estimation

### Free Tier (Small Projects)

**Backend:** Heroku Eco ($5/month) or Railway/Render (Free tier)
**Frontend:** Vercel or Netlify (Free)
**Database:** Included with Heroku/Railway/Render
**Email:** Gmail (Free, 500/day) or SendGrid (Free, 100/day)

**Total:** $0-5/month

### Production (Growing App)

**Backend:** Heroku Standard ($25/month) or AWS EC2 ($10-20/month)
**Frontend:** Vercel Pro ($20/month) or Netlify ($19/month)
**Database:** Heroku Postgres ($9/month) or AWS RDS ($15/month)
**Email:** SendGrid ($15/month for 40k emails)

**Total:** $60-100/month

### High Volume

**Backend:** AWS/DigitalOcean ($50-200/month)
**Frontend:** Vercel/Netlify ($100-200/month)
**Database:** AWS RDS ($50-200/month)
**Email:** AWS SES ($10-50/month)

**Total:** $200-650/month

---

## Support Resources

- **Heroku Docs:** https://devcenter.heroku.com/
- **Vercel Docs:** https://vercel.com/docs
- **SendGrid Docs:** https://docs.sendgrid.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

---

## Getting Help

If you run into issues:

1. Check hosting provider logs
2. Look at browser console errors
3. Review this troubleshooting section
4. Check `docs/EMAIL_VERIFICATION.md` for email-specific issues
5. Test locally with production environment variables

---

**🎉 That's it! Your ARC Raiders Companion app is now live in production with full email verification!**

Remember to:
- Monitor email sending (check SendGrid dashboard)
- Watch for errors in hosting logs
- Test regularly with new accounts
- Keep dependencies updated
- Backup your database regularly

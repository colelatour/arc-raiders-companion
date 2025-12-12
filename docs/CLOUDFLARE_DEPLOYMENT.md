# Cloudflare D1 Deployment Guide

This guide shows you how to deploy your ARC Raiders Companion API to Cloudflare Workers with D1 database.

## Why Cloudflare Workers + D1?

- ✅ **Serverless**: No servers to manage
- ✅ **Global**: Deploy to 300+ cities worldwide
- ✅ **Fast**: Edge computing with <50ms latency
- ✅ **Affordable**: Free tier includes 100k requests/day
- ✅ **Scalable**: Auto-scales to millions of requests

## Prerequisites

1. Cloudflare account (free): https://dash.cloudflare.com/sign-up
2. Node.js 18+ installed
3. Wrangler CLI installed globally

## Step-by-Step Setup

### 1. Install Wrangler

```bash
npm install -g wrangler
wrangler login
```

### 2. Create D1 Database

```bash
# Create the database
wrangler d1 create arc-raiders-db

# Copy the database_id from the output
# It will look like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. Update Configuration

Edit `wrangler.toml` and update the `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "arc-raiders-db"
database_id = "YOUR_DATABASE_ID_HERE"  # ← Paste your ID here
```

### 4. Convert Schema to SQLite

D1 uses SQLite, so convert your PostgreSQL schema:

```bash
node scripts/convert-schema-to-sqlite.js
```

This creates `database-schema-sqlite.sql`.

### 5. Initialize Database

Apply the schema to your D1 database:

```bash
wrangler d1 execute arc-raiders-db --file=./database-schema-sqlite.sql
```

Verify tables were created:

```bash
wrangler d1 execute arc-raiders-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 6. Set Environment Variables

Set secrets (sensitive values):

```bash
# Set JWT secret
wrangler secret put JWT_SECRET
# Paste your JWT secret when prompted

# Set email credentials (if using email)
wrangler secret put EMAIL_PASSWORD
wrangler secret put EMAIL_USER
```

Update public environment variables in `wrangler.toml`:

```toml
[vars]
NODE_ENV = "production"
FRONTEND_URL = "https://your-frontend-domain.com"
EMAIL_HOST = "smtp.sendgrid.net"
EMAIL_PORT = "587"
EMAIL_FROM = "ARC Raiders <noreply@yourdomain.com>"
```

### 7. Test Locally

Test your worker locally before deploying:

```bash
wrangler dev
```

Visit http://localhost:8787/api/health to test.

### 8. Deploy to Production

```bash
wrangler deploy
```

Your API will be live at:
```
https://arc-raiders-companion-api.YOUR-SUBDOMAIN.workers.dev
```

## Custom Domain (Optional)

### Add Custom Domain

1. Go to Cloudflare Dashboard
2. Select your Worker
3. Click "Triggers" → "Custom Domains"
4. Add your domain: `api.yourdomain.com`

Update CORS in your frontend to allow the new domain.

## Database Management

### Query Your Database

```bash
# Run SQL command
wrangler d1 execute arc-raiders-db --command="SELECT COUNT(*) FROM users"

# Run SQL file
wrangler d1 execute arc-raiders-db --file=./query.sql
```

### Backup Database

```bash
# Export all data
wrangler d1 export arc-raiders-db --output=backup.sql
```

### View Database Info

```bash
wrangler d1 info arc-raiders-db
```

### View Logs

```bash
# Live logs
wrangler tail

# Filter logs
wrangler tail --status error
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

Get your API token: https://dash.cloudflare.com/profile/api-tokens

## Cost Estimation

### D1 Database (Free Tier)

- ✅ 5 GB storage
- ✅ 5 million row reads/day
- ✅ 100k row writes/day

Perfect for small to medium apps!

### Workers (Free Tier)

- ✅ 100k requests/day
- ✅ 10ms CPU time per request

### Paid Tier (if needed)

- $5/month for Workers
- Pay-as-you-go for D1

## Monitoring

### View Analytics

1. Go to Cloudflare Dashboard
2. Select your Worker
3. View metrics: requests, errors, latency

### Set Up Alerts

1. Workers → Your Worker → Settings
2. Add email alerts for errors

## Troubleshooting

### "Database not found"

Make sure `database_id` in `wrangler.toml` matches your D1 database.

### "Module not found"

Ensure your import paths are correct and use `.js` extensions.

### CORS Issues

Update CORS origins in `server-cloudflare.js` to include your frontend domain.

### "Too many requests"

You've hit the free tier limit. Upgrade to paid tier or optimize queries.

## Rollback

If deployment fails, rollback to previous version:

```bash
# List deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback [deployment-id]
```

## Migration from Other Platforms

### From Heroku

1. Export data: `heroku pg:backups:capture`
2. Convert to SQLite format
3. Import to D1

### From Vercel/Netlify

1. Update API endpoints in frontend
2. Deploy worker
3. Test thoroughly
4. Switch DNS

## Best Practices

1. **Use Secrets**: Store sensitive data with `wrangler secret put`
2. **Test Locally**: Always test with `wrangler dev` first
3. **Monitor Logs**: Check `wrangler tail` regularly
4. **Backup Data**: Export D1 data regularly
5. **Use Versions**: Tag deployments for easy rollback

## Next Steps

- [ ] Set up custom domain
- [ ] Configure CI/CD
- [ ] Set up monitoring alerts
- [ ] Test all API endpoints
- [ ] Update frontend to use new API URL

## Resources

- D1 Documentation: https://developers.cloudflare.com/d1/
- Workers Documentation: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- Cloudflare Community: https://community.cloudflare.com/

## Support

Need help? 
- Discord: https://discord.cloudflare.com
- Forum: https://community.cloudflare.com
- Docs: https://developers.cloudflare.com

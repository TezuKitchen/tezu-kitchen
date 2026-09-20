# TezuKitchen — Deployment Guide

## Architecture Overview

```
Internet
   │
   ▼
┌──────────────┐
│   Nginx      │  ← TLS termination (ports 80/443)
│  (reverse    │
│   proxy)     │
└──────┬───────┘
       │ http://backend:8080  (Docker internal network)
       ▼
┌──────────────┐     ┌──────────────┐
│  Spring Boot │────▶│  PostgreSQL  │
│  Backend     │     │  Database    │
│  (port 8080) │     │  (port 5432) │
└──────────────┘     └──────────────┘
```

- **Nginx** terminates TLS and forwards `/api/*` requests to the backend.
- **Backend** is only reachable within the Docker network on port 8080.
- **PostgreSQL** is only reachable within the Docker network on port 5432 (host-mapped to 5433 for local dev).

## Prerequisites

- Docker & Docker Compose v2+
- A domain name pointing to your server's public IP (e.g., `api.tezukitchen.com`)
- Ports 80 and 443 open in your firewall

## TLS Certificates with Let's Encrypt

### First-Time Setup

#### 1. Prepare the directory structure

```bash
cd /path/to/TezuKitchen

# Create directories for certificates and Certbot webroot
mkdir -p certs certbot/www
```

#### 2. Obtain certificates using Certbot (standalone mode)

Stop any services using port 80 first, then run:

```bash
sudo certbot certonly \
  --standalone \
  --agree-tos \
  --no-eff-email \
  -m your-email@example.com \
  -d api.tezukitchen.com
```

This creates certificates at:
- `/etc/letsencrypt/live/api.tezukitchen.com/fullchain.pem`
- `/etc/letsencrypt/live/api.tezukitchen.com/privkey.pem`

#### 3. Copy or symlink certificates to the project

```bash
# Copy to the project's certs/ directory
sudo cp /etc/letsencrypt/live/api.tezukitchen.com/fullchain.pem ./certs/fullchain.pem
sudo cp /etc/letsencrypt/live/api.tezukitchen.com/privkey.pem ./certs/privkey.pem

# Make readable by Docker
sudo chmod 644 ./certs/fullchain.pem
sudo chmod 600 ./certs/privkey.pem
```

#### 4. Start the stack

```bash
docker compose up -d
```

Verify HTTPS is working:
```bash
curl -I https://api.tezukitchen.com/api/v1/restaurants
```

### Alternative: Certbot with Webroot Mode

If the stack is already running (Nginx is handling port 80), you can use the webroot challenge instead of standalone:

```bash
sudo certbot certonly \
  --webroot \
  --webroot-path ./certbot/www \
  --agree-tos \
  --no-eff-email \
  -m your-email@example.com \
  -d api.tezukitchen.com
```

The `nginx.conf` already includes a `/.well-known/acme-challenge/` location block that serves files from the `certbot/www` directory, so this will work without stopping Nginx.

### Certificate Renewal

Let's Encrypt certificates expire every 90 days. Renew them with:

```bash
# Dry-run first to verify
sudo certbot renew --dry-run

# Actual renewal
sudo certbot renew
```

After renewal, copy the new certificates and reload Nginx:

```bash
sudo cp /etc/letsencrypt/live/api.tezukitchen.com/fullchain.pem ./certs/fullchain.pem
sudo cp /etc/letsencrypt/live/api.tezukitchen.com/privkey.pem ./certs/privkey.pem

# Reload Nginx without downtime
docker compose exec nginx nginx -s reload
```

### Automated Renewal (Cron Job)

Set up a cron job to auto-renew and reload:

```bash
sudo crontab -e
```

Add this line (runs twice daily as recommended by Let's Encrypt):

```cron
0 3,15 * * * certbot renew --quiet && cp /etc/letsencrypt/live/api.tezukitchen.com/fullchain.pem /path/to/TezuKitchen/certs/fullchain.pem && cp /etc/letsencrypt/live/api.tezukitchen.com/privkey.pem /path/to/TezuKitchen/certs/privkey.pem && docker compose -f /path/to/TezuKitchen/docker-compose.yml exec nginx nginx -s reload
```

> **Tip:** Replace `/path/to/TezuKitchen` with the actual absolute path on your server.

## Self-Signed Certificates (Local Development)

For testing the HTTPS setup locally without a real domain:

```bash
mkdir -p certs

openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout certs/privkey.pem \
  -out certs/fullchain.pem \
  -subj "/CN=localhost"
```

Then start the stack:
```bash
docker compose up -d
```

> **Note:** Browsers will show a security warning for self-signed certificates. This is expected and safe for local development.

## Environment Variables

All environment variables are read from the `.env` file in the project root. See [.env.example](../.env.example) for the full list and documentation.

Key variables for deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Base64-encoded signing key (≥256 bits) | `openssl rand -base64 64` |
| `DATABASE_URL` | PostgreSQL JDBC connection string | `jdbc:postgresql://postgres:5432/tezukitchen` |
| `DATABASE_USERNAME` | Database username | `tezukitchen` |
| `DATABASE_PASSWORD` | Database password | *(set a strong password)* |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `https://app.tezukitchen.com` |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | `rzp_live_XXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret | *(from Razorpay dashboard)* |

## Docker Compose Commands

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f nginx
docker compose logs -f backend

# Rebuild backend after code changes
docker compose up -d --build backend

# Reload Nginx config without restart
docker compose exec nginx nginx -s reload

# Stop everything
docker compose down

# Stop and remove volumes (WARNING: deletes database data)
docker compose down -v
```

## Security Checklist

Before going to production, verify:

- [ ] `JWT_SECRET` is a unique, randomly generated value (not the `.env.example` placeholder)
- [ ] `DATABASE_PASSWORD` is a strong, unique password
- [ ] `ALLOWED_ORIGINS` is set to your actual frontend domain(s)
- [ ] TLS certificates are valid and auto-renewing
- [ ] Backend port 8080 is **not** exposed to the public internet (only via Nginx)
- [ ] Firewall allows only ports 80, 443, and SSH
- [ ] Razorpay keys are production keys (not test keys)
- [ ] Database backups are scheduled and synced to off-server storage

## Database Backups

### Manual Backup

```bash
./scripts/backup-db.sh
```

This creates a compressed backup in `backups/`:
```
backups/tezukitchen_20260916_020000.sql.gz
```

To also prune backups older than 7 days:
```bash
./scripts/backup-db.sh --keep 7
```

### Manual Restore

```bash
./scripts/restore-db.sh backups/tezukitchen_20260916_020000.sql.gz
```

The script will:
1. Show the backup details and a **confirmation prompt**
2. Stop the backend to release connections
3. Drop and recreate the database
4. Restore from the backup
5. Prompt you to restart the backend

> **WARNING:** Restoring a backup permanently replaces all current data. Make sure you have a backup of the current state first.

### Automated Backups (Cron)

Schedule daily backups at 2 AM with automatic 30-day retention:

```bash
sudo crontab -e
```

Add:
```cron
0 2 * * * /path/to/TezuKitchen/scripts/backup-db.sh --keep 30 >> /var/log/tezukitchen-backup.log 2>&1
```

> **Tip:** Replace `/path/to/TezuKitchen` with the actual absolute path on your server.

### Off-Server Backup Sync

Keeping backups only on the same machine as the live database is a single point of failure. Sync your `backups/` directory to a cloud storage bucket after each backup.

#### Option A: rclone (Recommended)

[rclone](https://rclone.org/) supports S3, Google Cloud Storage, Azure Blob, Backblaze B2, and 40+ other providers.

```bash
# One-time setup
rclone config   # follow the interactive setup for your cloud provider

# Sync backups to a remote bucket
rclone sync ./backups remote:tezukitchen-backups
```

Add the sync after the backup in your cron job:
```cron
0 2 * * * /path/to/TezuKitchen/scripts/backup-db.sh --keep 30 && rclone sync /path/to/TezuKitchen/backups remote:tezukitchen-backups >> /var/log/tezukitchen-backup.log 2>&1
```

#### Option B: AWS S3 CLI

```bash
aws s3 sync ./backups s3://your-bucket/tezukitchen-backups/
```

#### Option C: rsync to another server

```bash
rsync -avz ./backups/ user@backup-server:/backups/tezukitchen/
```

## Observability & Monitoring

### Health Checks

The backend exposes a public health check endpoint via Spring Boot Actuator at:
```
https://api.tezukitchen.com/actuator/health
```

This endpoint returns a `200 OK` status with `{"status":"UP"}` when the application and database are healthy.

**Setting up Uptime Monitoring:**
To ensure your API is available, you can use a free service like [UptimeRobot](https://uptimerobot.com/) or [Better Stack](https://betterstack.com/uptime).
1. Create a new "HTTP(s)" monitor.
2. Set the URL to your health endpoint: `https://api.tezukitchen.com/actuator/health`.
3. Set the monitoring interval (e.g., 1 minute or 5 minutes).
4. Configure alerts (email, Slack, SMS) to be notified if the API goes down.

### Application Logs

Application logs are written to the console and also persisted to the `logs/` directory on the host machine.
```
logs/tezukitchen-api.log
```
These logs include structural context (request method, URI, authenticated user ID) to aid in debugging production issues without needing to reproduce them.

To view live logs from the container:
```bash
docker compose logs -f backend
```

## Razorpay Production Checklist

Before accepting live payments, you must complete Razorpay's KYC process and switch from test keys to live keys.

### 1. Complete KYC
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. On the left sidebar, click **Account Settings** -> **KYC**.
3. Submit your business details, bank account information, and required identity documents.
4. Wait for approval (usually takes 1-3 business days).

### 2. Generate Live Keys
Once KYC is approved and your account is in **Live Mode**:
1. In the Razorpay Dashboard, switch the environment toggle at the top from **Test Mode** to **Live Mode**.
2. Go to **Account Settings** -> **API Keys**.
3. Click **Generate Live Key**.
4. You will receive a `Key Id` and a `Key Secret`. Keep these secure; the secret will only be shown once.

### 3. Setup Live Webhooks
1. In Live Mode, navigate to **Account Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. URL: `https://api.tezukitchen.com/api/v1/payments/razorpay/webhook`
4. Secret: Generate a strong random string (e.g. `openssl rand -base64 32`) and paste it here.
5. Active Events: Select `payment.captured` and `order.paid`.
6. Save the webhook.

### 4. Update Production Configuration
On your production server, update the `.env` file:

```env
RAZORPAY_KEY_ID=rzp_live_YourLiveKeyIdHere
RAZORPAY_KEY_SECRET=YourLiveKeySecretHere
# Note: Add the webhook secret if you configured it in application.yml
# APP_RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
```

Then restart the backend to load the new keys:
```bash
docker compose up -d backend
```

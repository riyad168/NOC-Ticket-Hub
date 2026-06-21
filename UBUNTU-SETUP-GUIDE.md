# NOC Ticket Management System — Ubuntu Server Setup Guide

## Prerequisites

Ubuntu 20.04 / 22.04 / 24.04 LTS

---

## Step 1: System Update

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Node.js (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should show v20.x.x
npm -v
```

---

## Step 3: Install pnpm

```bash
npm install -g pnpm
pnpm -v
```

---

## Step 4: Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Set postgres password:

```bash
sudo -u postgres psql
```

Inside psql:
```sql
ALTER USER postgres PASSWORD 'your_password';
CREATE DATABASE noc_ticket_system;
\q
```

---

## Step 5: Upload / Clone Project

### Option A — Upload ZIP from Replit:
```bash
# Upload NOC-Ticket-Hub.zip to server, then:
sudo apt install -y unzip
unzip NOC-Ticket-Hub.zip -d /opt/noc-system
cd /opt/noc-system
```

### Option B — Git clone (if you have a repo):
```bash
git clone https://your-repo-url.git /opt/noc-system
cd /opt/noc-system
```

---

## Step 6: Create .env File

```bash
nano /opt/noc-system/artifacts/api-server/.env
```

Add these lines:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/noc_ticket_system
JWT_SECRET=noc_secret_key_2025
PORT=8080
```

Save: `Ctrl+X` → `Y` → `Enter`

---

## Step 7: Install Dependencies

```bash
cd /opt/noc-system
pnpm install
```

---

## Step 8: Setup Database

```bash
cd /opt/noc-system/artifacts/api-server
npx prisma generate
npx prisma db push
```

Seed default users/data:
```bash
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/noc_ticket_system \
JWT_SECRET=noc_secret_key_2025 \
npx tsx prisma/seed.ts
```

---

## Step 9: Test Run

```bash
cd /opt/noc-system
pnpm --filter @workspace/api-server run dev
```

Test in browser: `http://YOUR_SERVER_IP:8080`

Login: `admin@noc.com` / `admin123`

---

## Step 10: Run as Service (PM2) — for Production

### Install PM2:
```bash
npm install -g pm2
```

### Create start script:
```bash
nano /opt/noc-system/start.sh
```

```bash
#!/bin/bash
cd /opt/noc-system
pnpm --filter @workspace/api-server run dev
```

```bash
chmod +x /opt/noc-system/start.sh
```

### Start with PM2:
```bash
cd /opt/noc-system/artifacts/api-server
pnpm run build

pm2 start node --name "noc-app" -- --enable-source-maps dist/index.mjs
pm2 save
pm2 startup
```

### Useful PM2 commands:
```bash
pm2 status          # check status
pm2 logs noc-app    # view logs
pm2 restart noc-app # restart
pm2 stop noc-app    # stop
```

---

## Step 11: Nginx Reverse Proxy (Port 80)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/noc
```

Paste:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/noc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now access: `http://YOUR_DOMAIN_OR_IP` (port 80)

---

## Step 12: Firewall

```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8080
sudo ufw enable
```

---

## Step 13: SSL Certificate (HTTPS) — Optional

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Telegram Notifications Setup

Edit `.env` and add:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

How to get bot token:
1. Open Telegram → search `@BotFather`
2. Send `/newbot` → follow instructions
3. Copy the token

How to get chat ID:
1. Add bot to your group/channel
2. Send a message
3. Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Find `"chat":{"id":XXXXXX}` — that's your chat ID

---

## Default Login Credentials

| Role     | Email              | Password   |
|----------|--------------------|------------|
| Admin    | admin@noc.com      | admin123   |
| Manager  | manager@noc.com    | manager123 |
| Engineer | john@noc.com       | eng123     |
| Engineer | sarah@noc.com      | eng123     |
| Engineer | mike@noc.com       | eng123     |

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| `Can't connect to database` | Check PostgreSQL is running: `sudo systemctl status postgresql` |
| `Port 8080 in use` | `sudo lsof -i :8080` then `kill -9 PID` |
| `Permission denied` | `sudo chown -R $USER /opt/noc-system` |
| `pnpm: command not found` | Run `npm install -g pnpm` again |
| `prisma generate failed` | Delete `node_modules/.prisma` and run again |

---

*NOC Ticket Management System v1.0.0*

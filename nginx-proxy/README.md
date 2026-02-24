# 🚀 Vivora Preview Proxy — Nginx + Node.js Setup Guide

## Architecture
```
User Browser → *.vivorax.online → Nginx (SSL + routing) → Node.js Proxy (port 3456) → Modal Sandbox
```

## Quick Setup (Ubuntu/Debian VPS)

### 1. DNS Setup
Add a **wildcard A record** at your domain registrar:
```
Type: A
Name: *
Value: <your-server-IP>
TTL: Auto
```

Also add for the root domain:
```
Type: A
Name: @
Value: <your-server-IP>
```

### 2. Install Dependencies
```bash
sudo apt update
sudo apt install -y nginx nodejs npm certbot
```

### 3. SSL Certificate (Wildcard)
Use Certbot with DNS challenge for wildcard:
```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.vivorax.online" -d "vivorax.online"
```
Follow the instructions to add TXT records, then:
```bash
sudo mkdir -p /etc/ssl/vivorax
sudo cp /etc/letsencrypt/live/vivorax.online/fullchain.pem /etc/ssl/vivorax/
sudo cp /etc/letsencrypt/live/vivorax.online/privkey.pem /etc/ssl/vivorax/
```

### 4. Setup Node.js Proxy
```bash
cd /opt
sudo git clone <your-repo> vivora-proxy
cd vivora-proxy/nginx-proxy
npm install

# Create .env file
cp .env.example .env
nano .env  # Fill in your actual values
```

### 5. Run with PM2 (Process Manager)
```bash
sudo npm install -g pm2

# Start the proxy
pm2 start proxy-server.js --name vivora-proxy
pm2 save
pm2 startup  # Auto-start on reboot
```

### 6. Setup Nginx
```bash
sudo cp nginx.conf /etc/nginx/sites-available/vivorax-preview
sudo ln -s /etc/nginx/sites-available/vivorax-preview /etc/nginx/sites-enabled/
sudo nginx -t        # Test config
sudo systemctl reload nginx
```

### 7. Verify
```bash
# Test DNS
dig +short test.vivorax.online

# Test HTTPS
curl -I https://test.vivorax.online/
```

## How It Works
1. Browser requests `https://{project-id}.vivorax.online`
2. DNS resolves `*.vivorax.online` to your server IP
3. Nginx terminates SSL and forwards to Node.js on port 3456
4. Node.js extracts the subdomain (project ID)
5. Queries Supabase `sandbox_mappings` table for the `preview_url`
6. Proxies the request to the Modal sandbox
7. Strips `X-Frame-Options` headers so it works in iframes

## Auto-Reconnect
When a sandbox expires (520 error), the frontend automatically:
1. Creates a new sandbox via `modal-proxy` edge function
2. Updates `sandbox_mappings` with the same project ID → new preview URL
3. The proxy picks up the new URL on next request (30s cache TTL)
4. Same `{project-id}.vivorax.online` URL keeps working!

## Troubleshooting
- **502 Bad Gateway**: Node.js proxy not running → `pm2 status`
- **520 Error**: Modal sandbox expired → frontend auto-reconnects
- **SSL Error**: Certificate expired → `sudo certbot renew`
- **404 Not Found**: No mapping in DB → check `sandbox_mappings` table

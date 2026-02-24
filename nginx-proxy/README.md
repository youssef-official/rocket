# 🚀 Vivora Preview Proxy — Render Deployment Guide

## Architecture
```
Browser → {project-id}.vivorax.online → Render (SSL) → Node.js Proxy → Modal Sandbox
```

## Deploy to Render

### 1. Create Web Service on Render
1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo (or use "Deploy from Git")
3. Settings:
   - **Name**: `vivora-preview-proxy`
   - **Runtime**: Node
   - **Root Directory**: `nginx-proxy`
   - **Build Command**: `npm install`
   - **Start Command**: `node proxy-server.js`
   - **Plan**: Starter ($7/month) or higher

### 2. Add Environment Variables
In Render dashboard → your service → **Environment**:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://jdbjdntmawjlasirmgbe.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |
| `PREVIEW_DOMAIN` | `vivorax.online` |

> `PORT` is set automatically by Render.

### 3. Setup Wildcard Custom Domain
1. In Render dashboard → your service → **Settings** → **Custom Domains**
2. Add: `*.vivorax.online`
3. Render will give you a CNAME target (something like `xxx.onrender.com`)

### 4. DNS Configuration
At your domain registrar (Cloudflare, Namecheap, etc.):

```
Type: CNAME
Name: *
Value: <your-service>.onrender.com
TTL: Auto
```

> ⚠️ If using Cloudflare: set the CNAME to **DNS Only** (gray cloud),
> because Render handles SSL. Cloudflare proxy would interfere.

### 5. Verify
```bash
curl -I https://test.vivorax.online/health
# Should return: {"status":"ok"}
```

## How It Works
1. `{project-id}.vivorax.online` → DNS resolves to Render
2. Render terminates SSL automatically
3. Node.js extracts subdomain → queries Supabase for `preview_url`
4. Proxies request to Modal sandbox
5. Strips X-Frame-Options so iframe embedding works

## Auto-Reconnect
When a Modal sandbox expires (5 min), the frontend:
1. Creates a new sandbox via `modal-proxy` edge function
2. Updates `sandbox_mappings` with same project ID → new preview URL
3. Proxy picks up new URL on next request (30s cache)
4. Same URL keeps working! ✅

## Troubleshooting
| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Modal sandbox expired → frontend auto-reconnects |
| 404 Not Found | No mapping in DB → sandbox not created yet |
| SSL Error | Check Render custom domain SSL status |
| Slow first request | Cache miss → 30s TTL, subsequent requests faster |

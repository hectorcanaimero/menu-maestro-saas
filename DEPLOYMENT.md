# Production Deployment Guide

This guide explains how to deploy the PideAI multi-tenant food ordering platform to production using Docker Swarm and Traefik.

## Prerequisites

- Docker Swarm initialized
- Traefik v2+ running with Let's Encrypt configured
- External network `network_public` created
- GitHub Container Registry access

## Architecture Overview

```
Internet
   ↓
Traefik (ports 80/443)
   ↓
Dynamic Subdomain Routing
   ↓
Docker Container (nginx:80)
   ↓
React SPA (Vite build)
```

**Supported URL patterns:**
- `https://tienda1.pideai.com` → Store with subdomain `tienda1`
- `https://tienda2.pideai.com` → Store with subdomain `tienda2`
- `https://pideai.com` → Main landing/welcome page

## Step 1: Pull the Docker Image

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull the latest image
docker pull ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.0-alpha

# Or pull latest
docker pull ghcr.io/hectorcanaimero/menu-maestro-saas:latest
```

## Step 2: Configure Environment Variables

Create a `.env.production` file with your credentials:

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required variables:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Optional variables:**
```env
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://app.posthog.com
```

⚠️ **IMPORTANT**: Environment variables are **baked into the build** for Vite apps. To change them:
1. Update `.env.production`
2. Rebuild the Docker image OR
3. Use a custom build with your env vars

## Step 3: Configure Traefik

Ensure you have a `network_public` external network:

```bash
docker network create --driver=overlay network_public
```

Verify Traefik is configured with Let's Encrypt:

```yaml
# traefik.yml or docker-compose.yml
certificatesResolvers:
  letsencryptresolver:
    acme:
      email: your-email@domain.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

## Step 4: Update docker-compose.prod.yml

Edit `docker-compose.prod.yml` and customize:

1. **Change domain**: Replace `pideai.com` with your domain
   ```yaml
   - "traefik.http.routers.pideai-https.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.yourdomain.com`) || Host(`yourdomain.com`)"
   ```

2. **Update image tag** (if needed):
   ```yaml
   image: ghcr.io/hectorcanaimero/menu-maestro-saas:latest
   ```

3. **Adjust replicas** (optional):
   ```yaml
   replicas: 3  # For high availability
   ```

## Step 5: Deploy to Docker Swarm

```bash
# Load environment variables
export $(cat .env.production | xargs)

# Deploy the stack
docker stack deploy -c docker-compose.prod.yml pideai

# Check deployment status
docker stack services pideai

# View logs
docker service logs -f pideai_pideai-app
```

## Step 6: DNS Configuration

Configure DNS records for your domain:

**Main domain:**
```
A     pideai.com         → YOUR_SERVER_IP
AAAA  pideai.com         → YOUR_SERVER_IPv6 (optional)
```

**Wildcard for subdomains:**
```
A     *.pideai.com       → YOUR_SERVER_IP
AAAA  *.pideai.com       → YOUR_SERVER_IPv6 (optional)
```

**Verification:**
```bash
# Test DNS resolution
nslookup tienda1.pideai.com
nslookup tienda2.pideai.com

# Test HTTPS
curl -I https://tienda1.pideai.com
```

## Step 7: Verify Deployment

### Health Check
```bash
# Check container health
docker ps --filter "name=pideai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test health endpoint
curl http://YOUR_SERVER_IP/health
```

### Test Subdomain Routing
```bash
# Test subdomain 1
curl -H "Host: tienda1.pideai.com" http://localhost

# Test subdomain 2
curl -H "Host: tienda2.pideai.com" http://localhost
```

### Check Traefik Dashboard
If you have Traefik dashboard enabled:
- Go to `https://traefik.yourdomain.com`
- Verify routers and services are green
- Check SSL certificates are issued

## Troubleshooting

### Issue: Container exits immediately

**Solution:** Check logs for missing environment variables
```bash
docker service logs pideai_pideai-app
```

### Issue: SSL certificate not issued

**Solution:** Check Traefik ACME logs
```bash
# Find Traefik container
docker ps | grep traefik

# Check logs
docker logs <traefik_container_id>
```

Ensure:
- Ports 80 and 443 are open
- DNS points to your server
- Email is valid in Traefik config

### Issue: Subdomain not routing correctly

**Solution:** Check Traefik router rules
```bash
# Inspect service labels
docker service inspect pideai_pideai-app --format '{{json .Spec.Labels}}' | jq
```

Ensure:
- `HostRegexp` pattern matches your subdomain format
- Service port is `80` (not 3006)

### Issue: Environment variables not working

**Solution:** Environment variables are baked at build time for Vite

Option 1: Rebuild with your env vars
```bash
docker build --build-arg VITE_SUPABASE_URL=https://... -t custom-image .
```

Option 2: Use runtime config (requires code changes)
- Create a `config.js` served by nginx
- Load config at runtime in React app

### Issue: CORS errors

**Solution:** Configure Supabase CORS settings
- Go to Supabase Dashboard → Settings → API
- Add your domains to "Additional Allowed Origins"
- Include: `https://pideai.com`, `https://*.pideai.com`

## Scaling

### Horizontal Scaling (Multiple Replicas)

```bash
# Scale to 3 replicas
docker service scale pideai_pideai-app=3

# Traefik will automatically load balance
```

### Vertical Scaling (Resource Limits)

Add to `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

## Updates and Rollbacks

### Rolling Update

```bash
# Pull new image
docker pull ghcr.io/hectorcanaimero/menu-maestro-saas:v3.1.0

# Update service with zero downtime
docker service update --image ghcr.io/hectorcanaimero/menu-maestro-saas:v3.1.0 pideai_pideai-app
```

### Rollback

```bash
# Rollback to previous version
docker service rollback pideai_pideai-app
```

## Monitoring

### Service Status
```bash
# Check service health
watch -n 2 'docker service ps pideai_pideai-app'
```

### Resource Usage
```bash
# Container stats
docker stats $(docker ps -q --filter "name=pideai")
```

### Logs
```bash
# Follow logs
docker service logs -f --tail 100 pideai_pideai-app

# Filter errors only
docker service logs pideai_pideai-app 2>&1 | grep ERROR
```

## Security Best Practices

1. **Use secrets for sensitive data:**
   ```bash
   echo "your_supabase_key" | docker secret create supabase_key -
   ```

2. **Enable security headers** (already configured in nginx.conf):
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection

3. **Regular updates:**
   ```bash
   # Update to latest patch version
   docker pull ghcr.io/hectorcanaimero/menu-maestro-saas:latest
   docker service update --image ghcr.io/hectorcanaimero/menu-maestro-saas:latest pideai_pideai-app
   ```

4. **Firewall configuration:**
   ```bash
   # Only allow 80, 443, and SSH
   ufw allow 22/tcp
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

## Backup and Disaster Recovery

### Database Backups (Supabase)
- Supabase provides automatic daily backups
- Configure in Supabase Dashboard → Settings → Database

### Image Backups
```bash
# Save image to tar
docker save ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.0-alpha > pideai-v3.0.0.tar

# Restore from tar
docker load < pideai-v3.0.0.tar
```

## Performance Optimization

1. **Enable HTTP/2** in Traefik (default)
2. **Use CDN** for static assets (optional)
3. **Configure caching** in nginx.conf (already done)
4. **Monitor with PostHog** for user analytics

## Cost Optimization

- **Single replica** for low traffic: `replicas: 1`
- **Auto-scaling** with Docker Swarm limits
- **Shared Traefik** across multiple services
- **Free SSL** with Let's Encrypt

## Support

For issues:
- Check logs: `docker service logs pideai_pideai-app`
- Review Traefik dashboard
- Verify DNS and SSL certificates
- Test health endpoint: `curl http://SERVER_IP/health`

## Next Steps

1. Set up monitoring (Prometheus + Grafana)
2. Configure automated backups
3. Implement CI/CD pipeline
4. Add staging environment
5. Set up alerts (disk space, memory, errors)

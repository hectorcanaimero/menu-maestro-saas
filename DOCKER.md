# Docker Setup & CI/CD Guide

This document explains how to use Docker with this application and how the automated CI/CD pipeline works.

**For production deployment with Traefik and Docker Swarm, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## Quick Start

### Development (with hot reload)

```bash
# Using docker-compose
docker-compose --profile dev up app-dev

# Or using docker directly
docker build -f Dockerfile.dev -t pideai-dev .
docker run -p 8080:8080 -v $(pwd):/app pideai-dev
```

Access the app at: http://localhost:8080

### Production

```bash
# Using docker-compose
docker-compose up app

# Or using docker directly
docker build -t pideai-app .
docker run -p 80:80 pideai-app
```

Access the app at: http://localhost

## CI/CD Pipeline

### Automated Docker Image Publishing

The project uses GitHub Actions to automatically build and publish Docker images to GitHub Container Registry (ghcr.io).

**Triggers:**
- ✅ When you push a version tag (e.g., `v1.0.0`, `v2.1.3`)
- ✅ When you publish a GitHub Release
- ✅ Manual trigger from GitHub Actions UI

### How to Create a Release

#### Option 1: Using Git Tags (Recommended)

```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# The CI/CD pipeline will automatically:
# 1. Build the Docker image
# 2. Tag it with multiple versions (v1.0.0, v1.0, v1, latest)
# 3. Push it to ghcr.io
```

#### Option 2: Using GitHub Releases

1. Go to your repository on GitHub
2. Click "Releases" → "Create a new release"
3. Create a new tag (e.g., `v1.0.0`)
4. Add release notes
5. Click "Publish release"

The CI/CD pipeline will automatically build and publish the Docker image.

### Image Tags Generated

For a tag `v1.2.3`, the pipeline creates:
- `ghcr.io/owner/repo:v1.2.3` - Full version
- `ghcr.io/owner/repo:v1.2` - Major + minor
- `ghcr.io/owner/repo:v1` - Major version
- `ghcr.io/owner/repo:latest` - Latest release
- `ghcr.io/owner/repo:main-abc1234` - Commit SHA (for main branch)

### Pulling Published Images

```bash
# Login to GitHub Container Registry (one time)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull the latest image
docker pull ghcr.io/OWNER/REPO:latest

# Pull a specific version
docker pull ghcr.io/OWNER/REPO:v1.0.0

# Run the pulled image
docker run -p 80:80 ghcr.io/OWNER/REPO:latest
```

### Viewing Published Images

Go to: https://github.com/OWNER/REPO/pkgs/container/REPO

## Docker Files Explained

### `Dockerfile` (Production)
Multi-stage build that:
1. Builds the Vite app with optimized production build
2. Serves static files using nginx
3. Includes security headers and gzip compression
4. Optimized for small image size (~50MB)

### `Dockerfile.dev` (Development)
Single-stage build for development:
- Runs Vite dev server with hot reload
- Mounts source code as volume for instant changes
- Includes all devDependencies

### `nginx.conf`
Production nginx configuration:
- SPA routing (all routes fallback to index.html)
- Gzip compression for assets
- Security headers (X-Frame-Options, CSP, etc.)
- Static asset caching (1 year for immutable assets)
- Health check endpoint at `/health`

### `.dockerignore`
Excludes unnecessary files from Docker build:
- node_modules (installed during build)
- .git, .env files
- Documentation
- IDE configurations

## Environment Variables

### Required for Production

Create a `.env` file or pass as Docker environment variables:

```bash
docker run -p 80:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  -e VITE_POSTHOG_KEY=your_key \
  -e VITE_POSTHOG_HOST=https://app.posthog.com \
  ghcr.io/OWNER/REPO:latest
```

**Note:** Environment variables must be set at **build time** for Vite apps, not at runtime.

## Advanced Usage

### Build for specific platform

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t pideai-app .
```

### Multi-architecture support

The CI/CD pipeline automatically builds for:
- `linux/amd64` (x86_64, Intel/AMD)
- `linux/arm64` (ARM, Apple Silicon, AWS Graviton)

### Custom nginx configuration

Edit `nginx.conf` to:
- Add custom headers
- Configure SSL/TLS
- Add rate limiting
- Configure caching policies

### Health Check

The production image includes a health check:

```bash
# Docker will automatically check /health endpoint every 30s
docker ps  # Check health status in the STATUS column
```

## Troubleshooting

### Image build fails

```bash
# Clear Docker cache and rebuild
docker builder prune -a
docker build --no-cache -t pideai-app .
```

### Container exits immediately

```bash
# Check logs
docker logs <container_id>

# Run interactively to debug
docker run -it pideai-app sh
```

### Port already in use

```bash
# Use a different port
docker run -p 8081:80 pideai-app
```

## CI/CD Pipeline Monitoring

### View workflow runs
Go to: https://github.com/OWNER/REPO/actions

### Manual trigger
1. Go to Actions tab
2. Select "Docker Build & Publish"
3. Click "Run workflow"
4. Select branch/tag
5. Click "Run workflow"

## Security Notes

1. **GitHub Token**: Automatically provided by GitHub Actions, no manual setup needed
2. **Image Visibility**: By default, images are public. To make them private:
   - Go to Package settings
   - Change visibility to "Private"
3. **Environment Variables**: Never commit `.env` files. Use GitHub Secrets for sensitive data in CI/CD.

## Performance Optimization

### Build cache
The CI/CD pipeline uses GitHub Actions cache to speed up builds:
- Dependencies are cached between runs
- Only changed layers are rebuilt
- Typical build time: 2-5 minutes

### Image size
Production image is optimized:
- Multi-stage build (build artifacts not included)
- Alpine Linux base (~5MB)
- nginx Alpine (~25MB)
- Total: ~50MB (vs ~500MB for full Node image)

## Next Steps

1. ✅ Push your first tag: `git tag v1.0.0 && git push origin v1.0.0`
2. ✅ Check GitHub Actions to see the build progress
3. ✅ View your published image in GitHub Packages
4. ✅ Pull and run your image anywhere

## Support

For issues with:
- **Docker setup**: Check this guide and Docker logs
- **CI/CD pipeline**: Check GitHub Actions logs
- **Application issues**: See main README.md

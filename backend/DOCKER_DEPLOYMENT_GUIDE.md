# Docker Deployment Guide for DigitalOcean

## Overview

This guide walks you through building a Docker image of the backend and deploying it to DigitalOcean using either Docker Hub (recommended for beginners) or DigitalOcean Container Registry.

---

## Prerequisites

- Docker installed locally
- DigitalOcean account with credits
- Git installed
- Docker Hub account (optional, but recommended for easier management)

---

## Step 1: Build the Docker Image Locally

### 1.1 Build the image

```bash
# From the backend directory
docker build -t anand-backend:latest .

# Or with a specific version tag
docker build -t anand-backend:1.0.0 .
```

### 1.2 Test the image locally

```bash
# Run with environment variables pointing to your local/cloud MongoDB and Redis
docker run -p 4000:4000 \
  -e MONGODB_URI="mongodb://admin:password@host.docker.internal:27017/dbname?authSource=admin" \
  -e REDIS_URL="redis://host.docker.internal:6379" \
  -e NODE_ENV="production" \
  -e PORT="4000" \
  anand-backend:latest
```

---

## Step 2: Push to Docker Registry

### Option A: Docker Hub (Easiest)

**1. Create a Docker Hub repository**

- Go to [Docker Hub](https://hub.docker.com)
- Click "Create Repository"
- Name it (e.g., `anand-backend`)
- Make it public or private (private recommended for production)

**2. Tag your image**

```bash
# Replace 'yourusername' with your Docker Hub username
docker tag anand-backend:latest yourusername/anand-backend:latest
docker tag anand-backend:latest yourusername/anand-backend:1.0.0
```

**3. Login to Docker Hub**

```bash
docker login
# Enter your Docker Hub username and password
```

**4. Push the image**

```bash
docker push yourusername/anand-backend:latest
docker push yourusername/anand-backend:1.0.0
```

### Option B: DigitalOcean Container Registry

**1. Create a container registry in DigitalOcean**

- Go to DigitalOcean Dashboard → Container Registry
- Click "Create Registry"
- Choose a name (e.g., `anand-registry`)
- Select a data center region

**2. Tag your image for DigitalOcean**

```bash
# Replace 'your-registry' and 'your-region' accordingly
docker tag anand-backend:latest registry.digitalocean.com/your-registry/anand-backend:latest
```

**3. Login to DigitalOcean Registry**

```bash
# Generate a personal access token in DigitalOcean Dashboard first
# Account → API → Tokens → Generate New Token

doctl auth init
# Or manually:
doctl registry login --expiry-seconds 3600

# Alternative: Use auth token directly
cat ~/your-auth-token.txt | docker login -u any --password-stdin registry.digitalocean.com
```

**4. Push the image**

```bash
docker push registry.digitalocean.com/your-registry/anand-backend:latest
```

---

## Step 3: Deploy to DigitalOcean App Platform (Recommended for Beginners)

**DigitalOcean App Platform** handles the deployment automatically.

### 3.1 Create an App

1. Go to DigitalOcean Dashboard → **App Platform** → **Create App**
2. Select your repository source:
   - **For Docker Hub:** GitHub/GitLab (connects to your repo with Dockerfile)
   - **For DO Registry:** Choose your container registry
3. Click **Next**

### 3.2 Configure the App

1. **Resource Configuration:**
   - Set instance type (Basic is usually enough for development)
   - Set auto-scaling if needed (1-2 instances recommended)
   - Enable auto-deploy on push (optional)

2. **Environment Variables:**
   - Click **Edit** on the backend service
   - Add environment variables:
     ```
     NODE_ENV=production
     PORT=8080
     MONGODB_URI=mongodb+srv://user:pass@your-cluster.mongodb.net/dbname
     REDIS_URL=redis://your-redis-host:6379
     OIDC_RSA_PRIVATE_KEY=your-private-key
     # Add other required variables
     ```

3. **Port Configuration:**
   - HTTP Port: `8080` or `4000` (auto-assigned by App Platform)

### 3.3 Deploy

1. Click **Create Resources**
2. Wait for deployment to complete (5-10 minutes)
3. Your app will be available at a DO-generated URL (e.g., `https://anand-backend.ondigitalocean.app`)

---

## Step 4: Deploy to DigitalOcean Droplet (More Control)

If you want direct control and Docker management, use a Droplet.

### 4.1 Create a Droplet

1. Go to DigitalOcean Dashboard → **Droplets** → **Create**
2. Choose settings:
   - **Region:** Pick closest to your users
   - **Image:** Ubuntu 22.04 LTS (recommended)
   - **Size:** Basic ($5-6/month for small apps)
   - **Authentication:** SSH key (more secure than password)
3. Create the Droplet

### 4.2 SSH into your Droplet

```bash
ssh root@your-droplet-ip
```

### 4.3 Install Docker

```bash
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 4.4 Create `.env` file on the Droplet

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Create the directory and env file
mkdir -p /opt/anand-backend
cd /opt/anand-backend

cat > .env << 'EOF'
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://user:pass@your-cluster.mongodb.net/dbname
REDIS_URL=redis://your-redis-host:6379
OIDC_RSA_PRIVATE_KEY=your-private-key
# Add other variables
EOF
```

### 4.5 Create docker-compose.yml for production

```bash
cat > /opt/anand-backend/docker-compose.yml << 'EOF'
version: "3.9"

services:
  backend:
    image: yourusername/anand-backend:latest
    # Or use: registry.digitalocean.com/your-registry/anand-backend:latest
    container_name: anand-backend
    restart: always
    ports:
      - "80:4000"  # Maps port 80 to container port 4000
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - REDIS_URL=${REDIS_URL}
      - OIDC_RSA_PRIVATE_KEY=${OIDC_RSA_PRIVATE_KEY}
      - PORT=4000
    # Optional: Add resource limits
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  # Optional: Nginx reverse proxy for SSL and better performance
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "443:443"
    volumes:
      - /opt/anand-backend/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
EOF
```

### 4.6 Pull and run the image

```bash
cd /opt/anand-backend

# Login to your registry (if using private images)
# docker login yourusername  # For Docker Hub
# doctl registry login       # For DigitalOcean Registry

# Pull the latest image
docker-compose pull

# Start the containers
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### 4.7 Set up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
certbot certonly --standalone -d yourdomain.com

# Update nginx config to use SSL, then restart
docker-compose restart nginx
```

### 4.8 Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Step 5: Monitoring and Maintenance

### Check container status

```bash
# On the Droplet
docker-compose ps
docker-compose logs backend
docker-compose logs --tail=100 -f backend  # Follow last 100 logs
```

### Update to latest image

```bash
cd /opt/anand-backend
docker-compose pull backend
docker-compose up -d backend  # Restart with new image
```

### Restart the service

```bash
docker-compose restart backend
```

---

## Environment Variables Checklist

Make sure you have these set before deploying:

- ✅ `MONGODB_URI` - Connection string to MongoDB
- ✅ `REDIS_URL` - Connection string to Redis
- ✅ `NODE_ENV` - Set to `production`
- ✅ `PORT` - Default `4000`
- ✅ `OIDC_RSA_PRIVATE_KEY` - OIDC signing key
- ✅ `OIDC_RSA_PRIVATE_KEY_PATH` - Alternative: path to key file (if using file)
- ✅ Any other service-specific variables (email, etc.)

---

## Troubleshooting

### Image won't build

```bash
# Check Docker logs
docker build -t anand-backend:latest . --progress=plain

# Verify files exist
ls -la src/ scripts/ cert/
```

### Container won't start

```bash
# Check container logs
docker logs container-name

# Verify environment variables are set
docker inspect container-name | grep -A 20 Env
```

### Connection to MongoDB/Redis fails

- Ensure MongoDB and Redis are reachable from the Droplet
- If using managed services, check firewall rules allow your Droplet IP
- Test connection: `docker exec container-name node -e "console.log(process.env.MONGODB_URI)"`

### High memory usage

- Reduce Node.js heap size: Add `NODE_OPTIONS=--max-old-space-size=256` to .env
- Implement caching and connection pooling

---

## Recommended Next Steps

1. **Set up monitoring:** Use DigitalOcean Monitoring or New Relic
2. **Auto-scaling:** Enable for App Platform deployments
3. **Backups:** Enable automated database backups
4. **CI/CD:** Use GitHub Actions to auto-build and push images on commit
5. **CDN:** Add Cloudflare or DigitalOcean CDN for frontend assets

---

## Quick Reference Commands

```bash
# Build image
docker build -t anand-backend:latest .

# Test locally
docker run -p 4000:4000 --env-file .env anand-backend:latest

# Push to Docker Hub
docker tag anand-backend:latest yourusername/anand-backend:latest
docker push yourusername/anand-backend:latest

# SSH into Droplet and update
ssh root@your-ip
cd /opt/anand-backend
docker-compose pull && docker-compose up -d

# View logs
docker-compose logs -f backend
```

---

Enjoy your deployment! 🚀

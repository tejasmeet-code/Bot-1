# Production Dockerfile for Relosta Discord Bot
# Targeted for US Virginia Hosting (Fly.io iad / AWS us-east-1 / Ashburn VPS)
FROM node:22-bullseye-slim AS base

# Install OS dependencies for Canvas & Voice
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    python3 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install npm dependencies
RUN npm ci --ignore-scripts || npm install --legacy-peer-deps

# Copy application source
COPY . .

# Build the web assets
RUN npm run build

# Expose HTTP port for Healthchecks & Web Dashboard
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV TARGET_HOST_LOCATION="US Virginia (Ashburn, VA)"
ENV TARGET_HOST_REGION="us-east-1 / iad"

# Persistent storage volume for bot JSON files
VOLUME ["/app/.data"]

# Run with tsx or node
CMD ["npm", "start"]

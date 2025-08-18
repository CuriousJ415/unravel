# UNRAVEL Dockerfile
# Clean, focused container for personal AI processing

FROM node:18-alpine AS base

# Install system dependencies including yt-dlp for YouTube processing
RUN apk add --no-cache \
    curl \
    ca-certificates \
    python3 \
    py3-pip \
    ffmpeg \
    yt-dlp \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY src/ ./src/
COPY patterns/ ./patterns/

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Create non-root user
RUN addgroup -g 1001 -S unravel && \
    adduser -S unravel -u 1001 -G unravel

# Change ownership
RUN chown -R unravel:unravel /app

# Switch to non-root user
USER unravel

# Expose port
EXPOSE 3006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3006/health || exit 1

# Start the application
CMD ["node", "src/backend/server.js"]
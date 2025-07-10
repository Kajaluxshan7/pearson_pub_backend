# ===========================================
# Production Dockerfile for NestJS Backend
# ===========================================

# ---------------------
# Stage 1: Dependencies
# ---------------------
# Use official Node.js LTS Alpine image for smaller size and better security
FROM node:20-alpine AS dependencies

# Set working directory inside container
WORKDIR /app

# Install system dependencies for native modules (if needed)
# Alpine packages: python3, make, g++ for node-gyp compilation
RUN apk add --no-cache python3 make g++

# Copy package files for dependency installation
# Only copying package files to leverage Docker layer caching
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm globally for faster package management
RUN npm install -g pnpm

# Install production dependencies only
# --frozen-lockfile ensures exact versions from lockfile
# --only=production excludes devDependencies
RUN pnpm install --frozen-lockfile --only=production

# ---------------------
# Stage 2: Build
# ---------------------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
# This creates the dist/ directory with compiled JavaScript
RUN pnpm run build

# ---------------------
# Stage 3: Production
# ---------------------
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from build stage
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist

# Copy production dependencies from dependencies stage
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy package.json for metadata (optional but recommended)
COPY --chown=nestjs:nodejs package*.json ./

# Create logs directory for application logs
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app/logs

# Switch to non-root user
USER nestjs

# Expose the port the app runs on
# Backend runs on port 5000
EXPOSE 5000

# Add health check to ensure container is running correctly
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); \
    const options = { \
      host: 'localhost', \
      port: 5000, \
      path: '/health', \
      timeout: 2000 \
    }; \
    const req = http.request(options, (res) => { \
      process.exit(res.statusCode === 200 ? 0 : 1); \
    }); \
    req.on('error', () => process.exit(1)); \
    req.end();"

# Set environment to production
ENV NODE_ENV=production

# Start the application using the production build
CMD ["node", "dist/main"]

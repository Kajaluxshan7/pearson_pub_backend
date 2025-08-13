# ------------------------
# Stage 1: Builder image
# ------------------------
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ curl

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml nest-cli.json tsconfig.json tsconfig.build.json ./

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Compile data-source.ts to JavaScript
RUN npx tsc data-source.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck

# ------------------------
# Stage 2: Production image
# ------------------------
FROM node:22-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@latest

# Copy package files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Install TypeORM CLI and required dependencies for migrations
RUN pnpm add typeorm ts-node typescript @types/node

# Copy built application and compiled data-source
COPY --from=builder /app/dist ./dist

# Copy migration script
COPY --from=builder /app/migrate.sh ./
RUN chmod +x migrate.sh

# Create startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'set -e' >> start.sh && \
    echo 'echo "🚀 Starting The Pearson Pub Backend..."' >> start.sh && \
    echo 'echo "📊 Running database migrations..."' >> start.sh && \
    echo 'npx typeorm -d dist/data-source.js migration:run' >> start.sh && \
    echo 'echo "✅ Migrations completed successfully"' >> start.sh && \
    echo 'echo "🎯 Starting main application..."' >> start.sh && \
    echo 'exec node dist/src/main.js' >> start.sh && \
    chmod +x start.sh

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expose port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV MIGRATION_MODE=true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["./start.sh"]

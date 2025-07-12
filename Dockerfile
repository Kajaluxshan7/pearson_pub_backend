# ------------------------
# Stage 1: Builder image
# ------------------------
FROM node:22-alpine AS builder

# set working dir
WORKDIR /app

# install system deps
RUN apk add --no-cache python3 make g++

# install pnpm
RUN npm install -g pnpm@latest

# copy package + TS configs for install & build
COPY package.json pnpm-lock.yaml nest-cli.json tsconfig.json tsconfig.build.json ./

# install all deps (incl. dev)
RUN pnpm install

# copy source
COPY . .

# build the app
RUN pnpm run build

# Compile data-source.ts to JavaScript
RUN npx tsc data-source.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports


# ------------------------
# Stage 2: Production image
# ------------------------
FROM node:22-alpine

WORKDIR /app

# copy built artifacts and prod deps manifests
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.develop.env ./.env

# install production deps only
RUN npm install -g pnpm@latest \
 && pnpm install --prod

# install TypeORM CLI and ts-node locally for migrations
RUN pnpm add typeorm ts-node typescript @types/node

# copy migration script
COPY --from=builder /app/migrate.sh ./
RUN chmod +x migrate.sh

# app listens on 5000
EXPOSE 5000
ENV PORT=5000
ENV MIGRATION_MODE=true

# create startup script that runs migrations first
RUN echo '#!/bin/sh' > start.sh && \
    echo 'set -e' >> start.sh && \
    echo 'echo "🚀 Starting application with migrations..."' >> start.sh && \
    echo 'echo "📊 Running database migrations..."' >> start.sh && \
    echo 'npx typeorm -d dist/data-source.js migration:run' >> start.sh && \
    echo 'echo "✅ Migrations completed successfully"' >> start.sh && \
    echo 'echo "🎯 Starting main application..."' >> start.sh && \
    echo 'exec node dist/src/main.js' >> start.sh && \
    chmod +x start.sh

# start the app with migrations
CMD ["./start.sh"]

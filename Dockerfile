# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

RUN npm install -g pnpm@latest

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000

CMD ["node", "dist/main.js"]

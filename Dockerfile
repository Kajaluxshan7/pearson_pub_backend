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
RUN pnpm install --frozen-lockfile

# copy source
COPY . .

# build the app
RUN pnpm run build


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
 && pnpm install --prod --frozen-lockfile

# app listens on 5000
EXPOSE 5000
ENV PORT=5000

# start the app
CMD ["node", "dist/main.js"]

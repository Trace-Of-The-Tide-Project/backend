# Build stage
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first and install deps (caches better)
COPY package*.json ./
RUN npm ci

# Copy the rest of the app and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install cloud-sql-proxy
RUN apk add --no-cache curl
RUN curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 && \
    chmod +x cloud-sql-proxy

# Copy only what is needed from the build stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["/bin/sh", "-c", "./cloud-sql-proxy trace-of-the-tide:europe-west2:trace-of-the-tide-db --unix-socket /cloudsql &  node dist/main"]
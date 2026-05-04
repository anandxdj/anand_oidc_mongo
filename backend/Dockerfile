# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies (production only)
RUN pnpm install --prod

# Copy application code
COPY src ./src
COPY scripts ./scripts
COPY cert ./cert
COPY server.js .

# Stage 2: Production stage
FROM node:22-alpine

# Install dumb-init for proper signal handling (before COPY to cache properly)
RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/cert ./cert
COPY --from=builder /app/server.js .
COPY package.json .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app \
    && chmod 600 /app/cert/private-key.pem \
    && chmod 644 /app/cert/public-key.pub
USER nodejs

# Expose port (default 4000)
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

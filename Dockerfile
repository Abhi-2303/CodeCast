# ─────────────────────────────────────────────
# Stage 1: Build the React frontend
# ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Production runtime (Express server)
# ─────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy the compiled React build from Stage 1
COPY --from=builder /app/build ./build

# Copy only the server-side files needed at runtime
COPY server.js ./
COPY src/actions/Actions.js ./src/actions/Actions.js

# Expose the backend port (matches SERVER_PORT in .env)
EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]

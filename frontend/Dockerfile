# ── Stage 1: Build ─────────────────────────────────────────────────────────
# Use a specific Node version for reproducible builds
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests first to leverage Docker layer caching.
# If package.json hasn't changed, npm install won't re-run on rebuilds.
COPY package*.json ./
RUN npm ci --omit=optional

# Copy source and build for production
COPY . .
RUN npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────
# nginx:alpine is ~25MB — much smaller than keeping the Node image
FROM nginx:alpine AS production

# Remove default nginx config and replace with ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled output from the builder stage (not node_modules or source)
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

# nginx starts in the foreground so Docker can track the process
CMD ["nginx", "-g", "daemon off;"]

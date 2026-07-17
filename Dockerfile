# ==========================================
# STAGE 1: Build the static frontend files
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy dependency configs and install packages
COPY package*.json ./
RUN npm ci

# Copy sources and compile the build
COPY tsconfig*.json vite.config.ts postcss.config.js tailwind.config.js tailwind.config.js ./
COPY public/ ./public/
COPY src/ ./src/
COPY index.html ./
RUN npm run build

# ==========================================
# STAGE 2: Set up backend & reverse proxy
# ==========================================
FROM python:3.11-slim AS final-server
WORKDIR /app

# Install Nginx and compiler build dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    curl \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy Django backend sources
COPY backend/ ./backend/

# Copy static frontend assets from STAGE 1
COPY --from=frontend-builder /app/dist/ /app/dist/

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/sites-available/default

# Copy entrypoint execution script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Expose standard Web Port
EXPOSE 80

# Run entrypoint script
CMD ["./entrypoint.sh"]

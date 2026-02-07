# Dockerfile optimizado para Traefik con SEO server (Express)
# Sirve estáticos + inyecta meta tags dinámicos por subdomain

##############################
# Stage 1: Build SPA
##############################
FROM node:20-alpine AS builder

WORKDIR /app

# Build args
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_PERSONAL_KEY
ARG VITE_POSTHOG_API_KEY
ARG VITE_POSTHOG_PROJECT_ID

# Export envs para el build
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY \
    VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST \
    VITE_POSTHOG_PERSONAL_KEY=$VITE_POSTHOG_PERSONAL_KEY \
    VITE_POSTHOG_API_KEY=$VITE_POSTHOG_API_KEY \
    VITE_POSTHOG_PROJECT_ID=$VITE_POSTHOG_PROJECT_ID

# Instalar deps
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

##############################
# Stage 2: Build server deps
##############################
FROM node:20-alpine AS server-deps

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --production

##############################
# Stage 3: Runtime
##############################
FROM node:20-alpine AS production

WORKDIR /app

# Copiar server + dependencias
COPY --from=server-deps /app/server/node_modules ./server/node_modules
COPY server/package.json ./server/
COPY server/index.js ./server/

# Copiar assets del build
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 80

# Healthcheck ligero
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

##############################
# Start server
##############################
CMD ["node", "server/index.js"]

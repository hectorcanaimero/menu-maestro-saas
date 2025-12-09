# Dockerfile optimizado para Traefik (sin nginx)
# Sirve estáticos vía Node + serve

##############################
# Stage 1: Build
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

# Export envs para el build
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY \
    VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST \
    VITE_POSTHOG_PERSONAL_KEY=$VITE_POSTHOG_PERSONAL_KEY

# Instalar deps
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

##############################
# Stage 2: Runtime
##############################
FROM node:20-alpine AS production

WORKDIR /app

# Instalar server estático
RUN npm install -g serve

# Copiar assets del build
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 3000

# Healthcheck ligero
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1


##############################
# Start server
##############################
CMD ["serve", "-s", "dist", "-l", "3000"]

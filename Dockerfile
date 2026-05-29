# ── Stage 1: Bağımlılıkları yükle ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# ── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Hangi uygulamayı build edeceğimiz dışarıdan geçilir: APP_NAME=auth-service
ARG APP_NAME
RUN npx nest build ${APP_NAME}

# ── Stage 3: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Sadece gerekli dosyaları kopyala → image boyutunu küçük tut
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]

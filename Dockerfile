# syntax=docker/dockerfile:1
# Frontend production image: Vite build + nginx (proxies /api → backend)

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

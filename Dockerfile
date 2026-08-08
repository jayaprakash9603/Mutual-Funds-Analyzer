# syntax=docker/dockerfile:1
# Expects a pre-built live frontend from the host:
#   npm ci
#   npm run build:live
#   (produces ./dist)

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

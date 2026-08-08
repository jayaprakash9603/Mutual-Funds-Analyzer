# syntax=docker/dockerfile:1
# Expects a pre-built JAR staged by scripts/build-docker-images.ps1:
#   backend/docker/app.jar
#
# No apt packages: Temurin already ships Java CA trust; optional corporate
# CAs are imported at runtime from /certs (see docker-entrypoint.sh).

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
COPY docker/app.jar /app/app.jar

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
ENV SSL_CERT_DIR=/certs
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD ["bash", "-c", "exec 3<>/dev/tcp/127.0.0.1/8080"]

ENTRYPOINT ["/bin/sh", "/app/docker-entrypoint.sh"]

# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /build

COPY pom.xml .
COPY src ./src
RUN mvn -B -q -DskipTests package \
    && cp target/mutual-funds-analyzer-backend-*.jar /build/app.jar

# Debian JRE (not Alpine): Alpine's CA bundle frequently breaks Java HTTPS
# to public APIs (mfapi.in / investt) with PKIX path building failures.
FROM eclipse-temurin:17-jre-jammy AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app --shell /usr/sbin/nologin app

USER app

COPY --from=build /build/app.jar /app/app.jar

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]

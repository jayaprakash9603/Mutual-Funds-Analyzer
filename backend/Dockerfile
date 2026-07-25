FROM eclipse-temurin:17-jre-alpine AS runtime
WORKDIR /app
COPY target/mutual-funds-analyzer-backend-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

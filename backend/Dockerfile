# === Stage 1: Build ===
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

# Copy Maven wrapper and POM first (for dependency caching)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B
RUN java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# === Stage 2: Runtime ===
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy layered jar
COPY --from=build /app/target/extracted/dependencies/ ./
COPY --from=build /app/target/extracted/spring-boot-loader/ ./
COPY --from=build /app/target/extracted/snapshot-dependencies/ ./
COPY --from=build /app/target/extracted/application/ ./

# No hardcoded credentials — all config via environment variables
EXPOSE 8080

USER appuser

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]

FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY Backend/services/auth-service/pom.xml ./pom.xml
COPY Backend/services/auth-service/src ./src

RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar /app/app.jar

EXPOSE 8081

CMD ["java", "-jar", "/app/app.jar"]

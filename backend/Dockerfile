#Stage 1: Build the application
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

#Copy Maven wrapper and pom.xml first 
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

#Download dependencies 
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

#Copy source code
COPY src/ src/

#Build the application
RUN ./mvnw clean package -DskipTests -B

#Stage 2: Run the application
FROM eclipse-temurin:21-jre
WORKDIR /app

#Copy the jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

#Expose port 8080
EXPOSE 8080

#Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]

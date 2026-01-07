[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Ix0BRiuI)

# XPoll
How to start the project:

1. With docker-compose:

```bash

docker-compose up -d --build

```

2. Without docker:
(Spring Boot does not take .env file automatically, needs to be set manually in environment variables of the project)

Backend + Database:
```bash
    cd backend
    ./mvnw spring-boot:run
```
Frontend:
```bash
    cd frontend
    npm install
    npm run build
```


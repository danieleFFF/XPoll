[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/Ix0BRiuI)

# XPoll, how to start the project:

### We have sent the .env file on teams

### 1. With docker-compose:

    ⚠️ put .env file in the root directory of the project

    docker-compose up -d --build


### 2. Without docker:

    ⚠️ (Spring Boot does not take .env file automatically, needs to be set manually in environment variables of the project)

    Backend + Database: 
    1. open the folder backend in intellij idea 
    2. put the variables in the environment variables of the project (.env)
    3. run the application

    Frontend:
        cd frontend
        npm install
        npm run dev


## How to Test

### Multi-Tab Session Protection

XPoll implements a **multi-tab protection system** to prevent users from participating in the same session from multiple browser tabs simultaneously. This ensures fair participation and prevents cheating.

#### Testing as Multiple Users

To properly test the application with multiple users (e.g., a poll creator and participants), you need to use **separate browser contexts**:

1. **Normal Browser Window** - Use for the first user (e.g., poll creator)
   - Open the application at `http://localhost` or `http://localhost:5173` if you are not using docker
   - Login or register as the first user
   - Create and start a poll session

2. **Incognito/Private Window** - Use for the second user (e.g., participant)
   - Open a new incognito/private window 
   - Navigate to `http://localhost` or `http://localhost:5173` if you are not using docker
   - Login or register as a different user (or join as guest)
   - Join the session using the session code


#### Why This Is Necessary

The multi-tab guard prevents:
- A single user from opening multiple tabs to vote multiple times
- Session conflicts when the same user tries to participate from different tabs
- Unfair advantages in scored polls/quizzes

If you try to open the same session in multiple tabs with the same browser profile, you will see a warning message and only the most recent tab will remain active.

#### Possible Problems

Other services are using the ports 5173 or 8080: turn off the services or change the ports in docker-compose.yml or .env files.


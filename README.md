# XPoll, how to start the project:

### 0. Create your .env file:
You'll need these 5 steps in order to run the project correctly:
1) Create a project on Google Cloud;
2) Enable Google Auth Platform from Google Cloud;
3) Create your Gemini API Key from aistudio.google.com;
4) Create a new Google Account to manage this project . From Settings, go to "password for the app";
5) Create in the root folder a file called *.env* (specify your credentials after every "="):

    *GOOGLE_CLIENT_ID=*
   
    *GOOGLE_CLIENT_SECRET=*
   
    *GEMINI_API_KEY=*
   
    *GEMINI_ENABLED=true*

    *MAIL_USERNAME=*

    *MAIL_PASSWORD=*

    *FRONTEND_URL=http://localhost*

    *VITE_API_URL=http://localhost:8080*

### 1. With docker-compose:

    ⚠️ Put your .env file in the root directory of the project and then run:

    docker-compose up -d --build


### 2. Without docker:

    ⚠️ Spring Boot doesn't take the .env file automatically: it needs to be set manually in the environment variables section of the project.

    Backend + Database: 
    1. Open the folder backend in IntelliJ Idea; 
    2. Put the variables in the environment variables of the project (.env);
    3. Run the application.

    From the frontend folder, run these commands:
        cd frontend
        npm install
        npm run dev


#### Possible Problems

Other services are using the ports 5173 or 5432 or 8080: turn off the services or change the ports in docker-compose.yml or .env files.


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


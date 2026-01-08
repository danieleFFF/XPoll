#Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

#Copy package files first 
COPY package*.json ./

#Install dependencies
RUN npm ci

#Copy source code
COPY . .

#Build arguments for environment variables at build time
ARG VITE_API_URL=/api

#Set environment variables
ENV VITE_API_URL=$VITE_API_URL

#Build the application
RUN npm run build


#Stage 2: Serve with Nginx
FROM nginx:alpine

#Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

#Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

#Expose port 80
EXPOSE 80

#Start nginx
CMD ["nginx", "-g", "daemon off;"]

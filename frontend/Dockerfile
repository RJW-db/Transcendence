# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# to install dependencies
COPY package*.json ./

# RUN npm install -g npm@11.6.2

# Install app dependencies
RUN npm install && npm install vite

# RUN npm install vite

# Copy the rest of the application source code
COPY frontend/ .

# Build the TypeScript application
# RUN npm run build

# Expose the port the app runs on
EXPOSE 5173

# Define the command to run your app
CMD [ "npm", "run", "dev:frontend" ]

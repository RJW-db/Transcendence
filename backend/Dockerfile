# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# to install dependencies
COPY package*.json .

# Install app dependencies
RUN apk update && \
    apk add make sqlite && \
    npm install

# Copy the rest of the application source code
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

COPY app.ts ./
COPY tsconfig.json ./

# Build the TypeScript application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run your app with database initialization
CMD [ "npm", "run", "start" ]
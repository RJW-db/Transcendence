# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# to install dependencies
COPY package*.json .

# Install app dependencies
RUN apk update && \
    apk add sqlite && \
    npm install

# Don't copy the entire prisma folder because of the database file
COPY prisma/schema.prisma ./prisma/
COPY prisma/config/pong_schema.sql ./prisma/config/
RUN mkdir ./prisma/database
RUN npx --yes prisma generate

# COPY app.ts  ./
# COPY messageHandler.ts ./
COPY tsconfig.json ./
COPY ./src ./src

# Build the TypeScript application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# ENTRYPOINT [ "sqlite3 ./prisma/database/pong_tournament.db < ./prisma/config/pong_schema.sql && npx --yes prisma generate" ]

# ENTRYPOINT ["sh", "-c", "sqlite3 ./prisma/database/pong_tournament.db < ./prisma/config/pong_schema.sql && npx --yes prisma generate && exec npm run start"]
ENTRYPOINT ["sh", "-c", "\
  if [ ! -f ./prisma/database/pong_tournament.db ]; then \
    sqlite3 ./prisma/database/pong_tournament.db < ./prisma/config/pong_schema.sql; \
  fi && \
  exec npm run start \
"]
# # Define the command to run your app with database initialization
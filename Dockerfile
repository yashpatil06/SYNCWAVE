# Multi-stage build for SyncWave full-stack app

# Stage 1: Build the React client
FROM node:18-alpine AS client

WORKDIR /app/client

# Copy package files
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY client/ ./

# Build the app
RUN npm run build

# Stage 2: Setup the Node.js server
FROM node:18-alpine

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies
RUN npm install

# Copy server source code
COPY server/ ./

# Copy built client from previous stage
COPY --from=client /app/client/build /app/client/build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start the server
CMD ["npm", "start"]
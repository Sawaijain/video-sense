FROM node:20-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY src ./src

# Create uploads directory
RUN mkdir -p uploads/videos uploads/frames

EXPOSE 5001

CMD ["node", "src/server.js"]

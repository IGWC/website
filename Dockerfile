# Use a lightweight Node.js image
FROM node:24-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your project files
COPY . .

# Build the Astro project
RUN npm run build

# Expose the host and port so Astro can be accessed outside the container
ENV HOST=0.0.0.0
ENV PORT=4324
EXPOSE 4324

# Start the Node server
CMD ["node", "./dist/server/entry.mjs"]
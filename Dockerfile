# Use a lightweight Node.js image
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# The URL is needed while Astro compiles the remote DB client.
# The secret token is intentionally not passed to the build.
ARG ASTRO_DB_REMOTE_URL
ENV ASTRO_DB_REMOTE_URL=$ASTRO_DB_REMOTE_URL

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=4324
EXPOSE 4324

CMD ["node", "./dist/server/entry.mjs"]
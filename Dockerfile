FROM node:22.20.0-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm ci && npm run build && npm prune --omit=dev

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]

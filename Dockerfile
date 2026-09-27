# Build stage
FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm pkg delete scripts.prepare && \
    npm ci

COPY tsconfig.json tsdown.config.ts ./
COPY src/ ./src/

RUN npm run build && \
    npm prune --omit=dev

# Production stage
FROM node:24-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

RUN mkdir -p /usr/src/app/data && \
    chown -R node:node /usr/src/app

USER node

COPY --chown=node:node package*.json ./
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD [ "node", "dist/index.mjs" ]

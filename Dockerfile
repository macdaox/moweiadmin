FROM node:18-alpine

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/

RUN cd server && npm ci --omit=dev

COPY server ./server

ENV NODE_ENV=production
ENV PORT=80

WORKDIR /app/server

EXPOSE 80

CMD ["node", "src/index.js"]


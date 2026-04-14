FROM node:18-slim AS build-admin

WORKDIR /app

RUN npm i -g pnpm@9.15.3

COPY admin-web/package.json admin-web/pnpm-lock.yaml ./admin-web/

RUN cd admin-web && pnpm install --frozen-lockfile

COPY admin-web ./admin-web

RUN cd admin-web && pnpm build


FROM node:18-slim AS runtime

WORKDIR /app

COPY server/package.json server/package-lock.json ./server/

RUN cd server && npm ci --omit=dev

COPY server ./server

RUN mkdir -p /app/server/public
COPY --from=build-admin /app/admin-web/dist /app/server/public

ENV NODE_ENV=production
ENV PORT=80

WORKDIR /app/server

EXPOSE 80

CMD ["node", "src/index.js"]

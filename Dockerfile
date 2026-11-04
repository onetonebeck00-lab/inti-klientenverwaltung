# Produktions-Image der Inti Klientenverwaltung
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production TZ=Europe/Berlin PORT=3000 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
# Datenbank-Migrationen beim Start anwenden, dann den Server starten
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -H 0.0.0.0"]

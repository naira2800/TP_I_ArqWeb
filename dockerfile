FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM node:22-alpine AS production
WORKDIR /app

# SOLUCIÓN: Cambiamos el dueño de los archivos al usuario 'node' mientras se copian
COPY --from=builder --chown=node:node /app .

# Ahora, cuando cambies a 'node', ya tendrá permisos sobre /app
USER node

EXPOSE 3000
CMD ["node", "server.js"]


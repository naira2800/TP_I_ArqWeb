# --- ETAPA 1: BUILDER ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Si generas la base de datos aquí, asegúrate de que esté en /app

# --- ETAPA 2: PRODUCTION ---
FROM node:22-alpine AS production

# Importante: Creamos el directorio antes y le damos permiso
RUN mkdir -p /app && chown -R node:node /app

WORKDIR /app

# Copiamos con chown explícito
COPY --from=builder --chown=node:node /app /app

# SQLite necesita escribir en el directorio, verifiquemos que el usuario sea node
USER node

EXPOSE 3000

# Comando para verificar permisos al arrancar (solo para debug)
# CMD ["sh", "-c", "ls -la /app && node server.js"]

CMD ["node", "server.js"]

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

FROM node:20-alpine

WORKDIR /app

COPY package.json ./
# npm install (not ci) — no lockfile required for this demo stub
RUN npm install --omit=dev

COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]

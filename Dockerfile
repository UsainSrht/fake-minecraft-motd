FROM node:18

WORKDIR /app
COPY . .

RUN npm install

EXPOSE 25565
CMD ["node", "server.js"]
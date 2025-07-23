FROM node:20-alpine

WORKDIR /app

COPY front-end-ui/package*.json ./

RUN npm install

COPY front-end-ui .

EXPOSE 3000

CMD ["npm", "start"]

FROM node:20-alpine

WORKDIR /app

COPY front-end-ui/package*.json ./

RUN npm install --legacy-peer-deps

COPY front-end-ui .

EXPOSE 3000

CMD sh -c '[ -f .env ] || cp copy.env .env && npm run dev'
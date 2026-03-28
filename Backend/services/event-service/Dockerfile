FROM node:20-alpine

WORKDIR /app

COPY ["Backend/services/event-service/package.json", "Backend/services/event-service/package-lock.json", "./"]
RUN npm ci --omit=dev

COPY Backend/services/event-service/src ./src

EXPOSE 3002

CMD ["npm", "start"]

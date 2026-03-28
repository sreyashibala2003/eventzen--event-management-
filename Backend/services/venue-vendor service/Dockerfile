FROM node:20-alpine

WORKDIR /app

COPY ["Backend/services/venue-vendor service/package.json", "Backend/services/venue-vendor service/package-lock.json", "./"]
RUN npm ci --omit=dev

COPY ["Backend/services/venue-vendor service/src", "./src"]

EXPOSE 3001

CMD ["npm", "start"]

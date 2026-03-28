FROM node:20-alpine AS build

WORKDIR /app

COPY ["Frontend/package.json", "Frontend/package-lock.json", "./"]
RUN npm ci

COPY Frontend/ ./

ARG VITE_API_BASE_URL=http://localhost:8081/api/v1
ARG VITE_EVENT_SERVICE_URL=http://localhost:3002/api/v1
ARG VITE_VENUE_VENDOR_SERVICE_URL=http://localhost:3001/api/v1
ARG VITE_BOOKING_SERVICE_URL=http://localhost:5050/api/v1

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_EVENT_SERVICE_URL=$VITE_EVENT_SERVICE_URL
ENV VITE_VENUE_VENDOR_SERVICE_URL=$VITE_VENUE_VENDOR_SERVICE_URL
ENV VITE_BOOKING_SERVICE_URL=$VITE_BOOKING_SERVICE_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

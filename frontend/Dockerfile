# Stage 1: Build React frontend
FROM node:22-alpine AS build

WORKDIR /frontend

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Stage 2: Serve compiled files
FROM nginx:alpine

COPY --from=build /frontend/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
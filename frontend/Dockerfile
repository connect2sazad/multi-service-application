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

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD \
    CMD wget --spider -q http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
# LTS as of 22 AUG -25
ARG NODE_VERSION=22.18.0-alpine

FROM node:${NODE_VERSION} as build

WORKDIR /app

COPY package.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist usr/share/nginx/html

# Required due to custom Dockerfile else the container stops
CMD ["nginx", "-g", "daemon off;"]
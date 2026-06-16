FROM node:22-alpine AS build

WORKDIR /app

COPY nexus-crm/package*.json ./
RUN npm ci

COPY nexus-crm/ ./

ARG VITE_API_BASE_URL
ARG VITE_AUTH_MODE=backend
ARG VITE_BACKEND_IDLE_TIMEOUT_MINUTES=120
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
ENV VITE_BACKEND_IDLE_TIMEOUT_MINUTES=$VITE_BACKEND_IDLE_TIMEOUT_MINUTES

RUN npm run build

FROM nginx:1.27-alpine

COPY nexus-crm/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

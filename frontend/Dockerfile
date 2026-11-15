# Multi-stage build with memory caps for low-spec hosts (Intel Pentium + 3GB RAM)
FROM node:20-alpine AS build

WORKDIR /app

# Cap Node memory allocation to 1GB during npm install & Vite build to avoid OOM
ENV NODE_OPTIONS="--max-old-space-size=1024"

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install --no-audit

COPY . .
RUN npm run build

FROM nginx:alpine

# Optimize Nginx worker processes for dual-core / low memory
RUN sed -i 's/worker_processes  auto;/worker_processes  1;/' /etc/nginx/nginx.conf

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Frontend Dockerfile - Multi-stage build
FROM node:18-alpine as builder

WORKDIR /app

# Zainstaluj dependencies
COPY package.json ./
RUN npm install

# Skopiuj kod źródłowy i builduj
COPY . .
RUN npm run build

# Production stage - nginx
FROM nginx:alpine

# Skopiuj nginx config
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Skopiuj zbudowaną aplikację
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Uruchom nginx
CMD ["nginx", "-g", "daemon off;"]

# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Zainstaluj dependencies (včetně devDependencies)
COPY package.json ./
RUN npm install

# Skopiuj kod źródłowy
COPY . .

# Expose port
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Uruchom aplikację
CMD ["npm", "start"]

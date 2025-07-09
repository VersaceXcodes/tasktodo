# Stage 1: Build the Vite React frontend
FROM node:18 AS frontend-build
WORKDIR /app
COPY vitereact/package*.json ./vitereact/
WORKDIR /app/vitereact
RUN npm install --legacy-peer-deps
COPY vitereact/ ./
RUN npm run build

# Stage 2: Set up the Node.js backend
FROM node:18
WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install
RUN npm install -g tsx

# Copy backend source
COPY backend/ ./

# Copy built frontend assets to backend's public directory
COPY --from=frontend-build /app/vitereact/dist ./public

# Set up environment
EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
ENV JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Initialize database and start server
CMD ["sh", "-c", "node initdb.js && NODE_ENV=production tsx server.ts"] 
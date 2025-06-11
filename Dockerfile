# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files from builder stage
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary config files
COPY --from=builder /app/.env* ./

# Expose port
EXPOSE 3031

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3031

# Start the application
CMD ["node", "dist/index.js"] 
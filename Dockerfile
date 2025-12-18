# Use a light node image to build/serve
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# If you use a build tool (like Vite or React), run the build command
# RUN npm run build

# Expose the port your app runs on (e.g., 3000 or 5173)
EXPOSE 3000

# Start the application
CMD ["serve", "-s", ".", "-l", "3000"]
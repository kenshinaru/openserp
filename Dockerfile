# Use the official Node.js image. mcr.microsoft.com/playwright
FROM node:20

# Set the working directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json.
COPY . .

# Install dependencies.
RUN npm install

RUN npm run build

RUN npm install -g playwright

RUN playwright install --with-deps


# Expose the port your app runs on.
EXPOSE 3000

# Command to run your app.
CMD ["node", "dist"]
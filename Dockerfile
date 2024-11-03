# Use the official Node.js image. mcr.microsoft.com/playwright
FROM mcr.microsoft.com/playwright

# Set the working directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json.
COPY package*.json ./

# Install dependencies.
RUN yarn

# Copy the rest of your application code.
COPY dist ./dist

# Expose the port your app runs on.
EXPOSE 3000

# Command to run your app.
CMD ["node", "dist"]
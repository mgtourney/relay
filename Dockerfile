FROM node:16-alpine AS builder

# Set the project workdir to /app
WORKDIR /build

# Copy the package.json over to the container
COPY package.json ./

# Install typescript and the dependencies
RUN npm install -g typescript && npm install

# Copy the rest of the project to the container
COPY . .

# Build the project with tsc
RUN tsc

# Prune the dev dependencies
RUN npm prune --omit=dev

# Now we have a compiled version of the project in the dist folder
# We can now create a new image with only the compiled javascript
FROM node:16-alpine

# Create the relay user and group
RUN addgroup -S relay && adduser -S realy -G relay

# Set the project workdir to /app
WORKDIR /app

# Set the user to relay
USER relay

# Copy the dist folder and node_modules from the builder
COPY --from=builder --chown=relay:relay /build/dist ./dist
COPY --from=builder --chown=relay:relay /build/node_modules ./node_modules

# Set the entrypoint to node
ENTRYPOINT ["node"]

# Set the command to run the compiled javascript
CMD ["dist/index.js"]
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Install build dependencies required by aws-lambda-ric (cmake, autoreconf toolchain)
RUN apt-get update \
  && apt-get install -y cmake autoconf automake libtool g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy package metadata and install dependencies (including aws-lambda-ric)
COPY package*.json ./
RUN npm install --omit=dev \
  && npm install aws-lambda-ric --save-prod

# Copy the rest of the project and build the Lambda bundle
COPY . .
RUN npm run build

# Lambda Runtime Interface Client entrypoint
ENTRYPOINT ["node", "node_modules/aws-lambda-ric/bin/index.mjs"]

# The handler is dist/index.handler (compiled from src/index.ts)
CMD ["dist/index.handler"]

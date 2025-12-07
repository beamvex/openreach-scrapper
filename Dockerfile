FROM amazon/aws-lambda-nodejs:24.2025.12.05.08-x86_64

WORKDIR /app

# Copy package metadata and install dependencies (including aws-lambda-ric)
COPY package*.json ./
RUN npm install 

RUN npx playwright install && \
  npx playwright install-deps

# Copy the rest of the project and build the Lambda bundle
COPY . .
RUN npm run build

# Lambda Runtime Interface Client entrypoint
ENTRYPOINT ["node", "dist/index.handler"]

FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

RUN npm install -S playwright

COPY ./dist /app/dist

CMD ["node","--enable-source-maps","dist/index.js"]
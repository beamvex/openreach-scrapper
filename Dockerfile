FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

RUN apt update 
RUN apt install cmake xz-utils build-essential -y 
RUN apt install autoconf automake libtool -y 
RUN apt install python3-pip python3-setuptools -y

RUN npm install -S aws-lambda-ric@4.0.0 playwright

COPY ./dist /app/dist


CMD ["node","dist/index.js"]
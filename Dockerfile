FROM debian:trixie

WORKDIR /app

RUN apt update
RUN apt install -y \
    curl \
    git \
    jq \
    unzip


#RUN npm install -S playwright

COPY ./dist /app/dist
COPY ./scripts /app/

RUN bash ./chrome-installer.sh

RUN apt install -y \
    libglib2.0-0 \
    libnspr4 \

FROM debian:trixie

RUN groupadd -g 990 sbx_user1051 \
    && useradd -m -u 1002 -g 990 sbx_user1051

RUN apt-get update 
RUN apt-get install -y \
    curl \
    ca-certificates \
    chromium

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

RUN mkdir /app 

WORKDIR /app




COPY ./scripts/runscript.sh /app/runscript.sh
RUN chmod +x /app/runscript.sh


COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json

#

COPY src /app/src
COPY esbuild.config.js /app/esbuild.config.js

RUN chown -R sbx_user1051:sbx_user1051 /app 

USER sbx_user1051

RUN npm install

RUN npm run build

ENTRYPOINT ["bash","/runscript.sh"]

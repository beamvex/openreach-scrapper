FROM lscr.io/linuxserver/webtop:debian-xfce 

RUN apt-get update
RUN apt-get install -y net-tools inetutils-tools inetutils-ping nano unzip gpg wget

RUN mv /usr/bin/chromium /usr/bin/og-chromium 

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install

COPY root/ /

RUN chmod +x /usr/bin/chromium

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

COPY ./scripts/runscript.sh /app/runscript.sh
RUN chmod +x /app/runscript.sh

COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
COPY node_modules /app/node_modules

COPY src /app/src
COPY esbuild.config.js /app/esbuild.config.js

RUN npm install

RUN npm run build

CMD ["bash","/app/runscript.sh"]


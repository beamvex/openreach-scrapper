FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

RUN npm install -S playwright

COPY ./dist /app/dist
COPY ./scripts /app/

RUN groupadd -g 990 sbx_user1051
RUN useradd -m -s /bin/bash -u 1002 -g 990 sbx_user1051


USER sbx_user1051

CMD ["node","--enable-source-maps","dist/index.js"]
#CMD ["bash","./runscript.sh"]
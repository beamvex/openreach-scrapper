FROM debian:trixie

RUN groupadd -g 990 sbx_user1051 \
    && useradd -m -u 1002 -g 990 sbx_user1051

RUN apt-get update 
RUN apt-get install -y \
    curl \
    ca-certificates \
    chromium

COPY ./scripts/runscript.sh /runscript.sh
RUN chmod +x /runscript.sh

USER sbx_user1051

ENTRYPOINT ["bash","/runscript.sh"]

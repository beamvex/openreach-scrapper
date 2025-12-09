#!/bin/bash
docker run --rm -it --read-only --tmpfs /tmp --entrypoint /bin/bash openreach-scrapper:latest

#docker run --rm -it --entrypoint /bin/bash openreach-scrapper:latest
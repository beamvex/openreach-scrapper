#!/bin/bash

env

sudo cat /proc/1/environ 

aws s3 ls

exit

whoami

export DISPLAY=:1

echo "starting chromium"

chromium \
  --remote-debugging-port=9222 \
  about:blank &

echo "chromium started"
echo waiting 5 seconds
sleep 5

node --enable-source-maps dist/index.js

killall chromium

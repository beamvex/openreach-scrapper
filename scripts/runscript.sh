#!/bin/bash

env

#echo waiting 60 seconds for desktop
#sleep 60

sudo cat /proc/1/environ 

aws s3 ls

whoami

export DISPLAY=:99

echo "starting Xvfb on ${DISPLAY}"
Xvfb ${DISPLAY} -screen 0 1280x720x24 -nolisten tcp &
XVFB_PID=$!

i=0
while [ ! -S "/tmp/.X11-unix/X${DISPLAY#:}" ] && [ $i -lt 50 ]; do
  i=$((i+1))
  sleep 0.1
done

echo "starting chromium"

chromium \
  --no-sandbox \
  --disable-dev-shm-usage \
  --remote-debugging-address=0.0.0.0 \
  --remote-debugging-port=9222 \
  about:blank &

echo "chromium started"
echo waiting 5 seconds
sleep 5

node --enable-source-maps dist/index.js

killall chromium

#!/bin/bash

echo wtf

whoami

# Use /tmp for all cache (incl. fontconfig)
export XDG_CACHE_HOME=/tmp/.cache

export XDG_DATA_HOME=/tmp/.chromium
export XDG_CONFIG_HOME=/tmp/.chromium

mkdir -p "$XDG_CACHE_HOME"
mkdir -p "$XDG_DATA_HOME"
mkdir -p "$XDG_CONFIG_HOME"

echo "starting chromium"

nohup chromium \
  --headless=new \
  --no-sandbox \
  --disable-setuid-sandbox \
  --disable-dev-shm-usage \
  --disable-gpu \
  --disable-gpu-sandbox \
  --no-zygote \
  --disable-crash-reporter \
  --no-crashpad \
  --remote-debugging-port=9222 \
  about:blank > /tmp/custom.log 2>&1 &

echo "chromium started"
echo waiting 11 seconds
sleep 11

node --enable-source-maps dist/index.js

killall chromium

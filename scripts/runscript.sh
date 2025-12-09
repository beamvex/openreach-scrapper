#!/bin/bash

echo wtf

whoami

# Use /tmp for all cache (incl. fontconfig)
export XDG_CACHE_HOME=/tmp/.cache
mkdir -p "$XDG_CACHE_HOME"

chromium --no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --headless --disable-gpu --disable-crash-reporter --no-crashpad

#node --enable-source-maps dist/index.js

#find /tmp/
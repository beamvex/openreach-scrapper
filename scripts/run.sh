#!/bin/bash
bash ./builddocker.sh

docker run --rm -it -p 3001:3001 \
  --name openreach-scrapper \
  -e AWS_PROFILE=512752756525_AdministratorAccess \
  -e S3_BUCKET_NAME=openreach-scrapper \
  -e S6_KEEP_ENV=1 \
  -v ~/.aws:/config/.aws \
  openreach-scrapper:latest
#!/bin/bash
bash ./builddocker.sh

docker run --rm -it -p 3001:3001 openreach-scrapper:latest /bin/bash
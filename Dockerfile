FROM mcr.microsoft.com/playwright:v1.50.0-noble


RUN apt update 
RUN apt install cmake xz-utils -y 

RUN npm install -g aws-lambda-ric

ENTRYPOINT ["npx", "aws-lambda-ric"]
CMD ["index.handler"]
FROM debian:13.2-slim

WORKDIR /app
SHELL ["/bin/bash", "-c"]

RUN apt update && \
    apt install sudo curl -y 


RUN useradd -m sbx_user1051
RUN usermod -aG sudo sbx_user1051
RUN echo 'sbx_user1051 ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers


USER sbx_user1051
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash 

RUN . ~/.profile && nvm install --lts
RUN . ~/.profile && npx playwright install chromium
RUN . ~/.profile && echo npx playwright install-deps

USER root
RUN chown -R sbx_user1051:sbx_user1051 /app
RUN chmod +x /app

# Copy package metadata and install dependencies (including aws-lambda-ric)
#COPY package*.json ./
#RUN npm install 

#RUN npx playwright install chromium   

# Copy the rest of the project and build the Lambda bundle
#COPY . .
#RUN npm run build


#RUN cp -r /root/ /home/sbx_user1051/
#RUN chown -R sbx_user1051:sbx_user1051 /home/sbx_user1051

USER sbx_user1051
WORKDIR /app
COPY scripts/runscript.sh /app/runscript.sh
RUN sudo chmod +x /app/runscript.sh


# Lambda Runtime Interface Client entrypoint
ENTRYPOINT ["/app/runscript.sh"]

FROM amazon/aws-lambda-nodejs:22

# install chrome dependencies
RUN dnf install -y atk cups-libs gtk3 libXcomposite alsa-lib \
    libXcursor libXdamage libXext libXi libXrandr libXScrnSaver \
    libXtst pango at-spi2-atk libXt xorg-x11-server-Xvfb \
    xorg-x11-xauth dbus-glib dbus-glib-devel nss mesa-libgbm jq unzip

COPY ./scripts/chrome-installer.sh ./chrome-installer.sh
RUN chmod 700 ./chrome-installer.sh
RUN ./chrome-installer.sh
RUN rm ./chrome-installer.sh

COPY ./scripts/runscript.sh ./runscript.sh
RUN chmod 755 ./runscript.sh

RUN dnf install -y shadow-utils

# ✅ Correct for Amazon Linux
RUN groupadd -g 990 sbx_user1051 \
    && useradd -m -u 1002 -g 990 sbx_user1051


USER sbx_user1051
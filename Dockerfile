FROM node:18

ADD ./server/ /usr/src/app
RUN cd /usr/src/app/; npm install
CMD "/usr/src/app/boot.sh"
EXPOSE 80

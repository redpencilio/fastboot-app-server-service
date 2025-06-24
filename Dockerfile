FROM node:20

COPY ./server/ /usr/src/app
RUN cd /usr/src/app/; npm install
CMD ["/usr/src/app/boot.sh"]
EXPOSE 80

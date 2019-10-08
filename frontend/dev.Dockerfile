FROM node:10

# Create app directory
WORKDIR /usr/src/help/app

EXPOSE 4200

CMD ["./dev.start.sh"]


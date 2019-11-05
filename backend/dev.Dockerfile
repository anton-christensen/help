FROM node:10

# Create app directory
WORKDIR /usr/src/help/api

EXPOSE 28080

CMD ["./dev.start.sh"]


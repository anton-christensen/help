FROM node:10

# Create app directory
WORKDIR /usr/src/help/app


CMD ["./dev.start.sh"]
# CMD [ "npm", "run", "start" ]

expose 4200

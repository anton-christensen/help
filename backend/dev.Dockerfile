FROM node:10

# Create app directory
WORKDIR /usr/src/help/api

CMD ["./dev.start.sh"]

# CMD [ "npm" "i" "&&" "npm", "run", "dev" ]

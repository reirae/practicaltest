FROM node:alpine

RUN apk add --no-cache tini git \
    && npm install -g git-http-server

WORKDIR /home/git

RUN git init --bare repository.git

ENTRYPOINT ["tini", "--", "git-http-server", "-p", "3000", "/home/git"]

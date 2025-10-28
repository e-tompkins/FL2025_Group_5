FROM docker.io/node:latest

WORKDIR /app

RUN apt-get update

COPY ../package.json .
RUN npm install


FROM docker.io/node:latest

WORKDIR /app/api

RUN apt-get update

COPY ../../../../package.json .
RUN npm install

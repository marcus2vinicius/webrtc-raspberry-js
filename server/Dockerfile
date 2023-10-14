FROM node:14

RUN useradd -u 1001 -m marcus


RUN apt-get update && apt-get install -y chromium screen xvfb

WORKDIR /app

COPY index.html .
COPY script-server.js .
COPY start.sh /app/

RUN npm install -g http-serve

USER marcus

EXPOSE 8081

CMD ["./start.sh"]



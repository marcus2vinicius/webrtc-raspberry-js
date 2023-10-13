FROM node:14

RUN apt-get update \
    && apt-get install -y chromium-browser screen xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY index.html .
COPY script-server.js .
COPY start.sh /app/

RUN npm install -g http-serve

EXPOSE 8081

CMD ["./start.sh"]
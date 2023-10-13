FROM node:14

WORKDIR /app

COPY index.html .
COPY script.js .

RUN npm install -g http-serve

EXPOSE 8082

CMD ["http-serve", "-p", "8082"]
FROM docker.io/node:23-alpine3.19
EXPOSE 8080

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /app
RUN chown node:node ./

USER node

COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force

COPY *.js ./
COPY frontend/ frontend/

CMD ["node", "./backend.js"]
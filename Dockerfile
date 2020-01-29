FROM node:10 AS build

RUN mkdir -p /usr/build
WORKDIR /usr/build
COPY . .

RUN npm ci
RUN npm run build

FROM node:10-alpine

RUN mkdir -p /usr/dist
WORKDIR /usr/dist
COPY --from=build /usr/build/dist ./dist
COPY --from=build /usr/build/node_modules ./node_modules

CMD ["sh", "-c", "cat /usr/config/config.json | node dist/index.js"]

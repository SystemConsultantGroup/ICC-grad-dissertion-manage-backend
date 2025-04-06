FROM node:18-alpine

# Korean Timezone Setting
# ADD https://worldtimeapi.org/api/timezone/Asia/Seoul /tmp/bustcache

WORKDIR /app
COPY /.husky ./
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

ENV LANG=ko_KR.UTF-8
ENV LANGUAGE=ko_KR.UTF-

# package.json, package-lock.json
COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY resources ./resources
RUN npm run build

ENTRYPOINT [ "node" ]
CMD ["dist/src/main"]
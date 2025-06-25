FROM node:18-alpine

# Install tzdata and set timezone to Asia/Seoul
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
  && echo "Asia/Seoul" > /etc/timezone

# Set locale to Korean (optional, only for string formatting, etc.)
ENV TZ=Asia/Seoul
ENV LANG=ko_KR.UTF-8
ENV LANGUAGE=ko_KR:ko

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npm run build

ENTRYPOINT ["node"]
CMD ["dist/src/main"]

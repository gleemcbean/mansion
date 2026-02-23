FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

EXPOSE 4000

CMD ["bun", "run", "start"]
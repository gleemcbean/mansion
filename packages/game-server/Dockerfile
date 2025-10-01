FROM oven/bun:latest

WORKDIR /app
COPY . /app

RUN bun install --production

CMD ["bun", "run", "start"]
FROM oven/bun:latest

WORKDIR /app/packages/game-server

COPY packages/game-server/ ./
COPY packages/shared/ /app/packages/shared


RUN bun install

EXPOSE 8080

CMD ["bun", "run", "start"]
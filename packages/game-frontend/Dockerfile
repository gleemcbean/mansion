FROM oven/bun:latest

WORKDIR /app/packages/game-frontend

COPY packages/game-frontend/ ./
COPY packages/shared/ /app/packages/shared

RUN bun install 

EXPOSE 3000

CMD ["bun", "run", "dev"]
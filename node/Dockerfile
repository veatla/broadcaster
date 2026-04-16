FROM oven/bun:latest

WORKDIR /app

# сначала зависимости (кеш)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# потом код
COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]

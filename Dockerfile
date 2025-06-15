# Build stage
FROM oven/bun:1.1 as builder

WORKDIR /app

COPY . .

RUN bun install
RUN bun run build

# Runtime stage
FROM oven/bun:1.1

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY bun.lockb ./
COPY package.json ./

RUN bun install --production

CMD ["bun", "run", "dist/index.js"]

FROM oven/bun:latest

WORKDIR /app

# Copy package files dari root
COPY package.json bun.lock ./

# Install dependencies
RUN bun install

# Copy seluruh isi project (termasuk folder server)
COPY . .

# Hono biasanya jalan di port 3000
EXPOSE 3000

# Jalankan file utama yang ada di dalam folder server
CMD ["bun", "run", "server/index.ts"]
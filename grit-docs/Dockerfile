FROM node:lts

WORKDIR /app

RUN npm install -g pnpm@10.30.1

COPY package.json /app/package.json
COPY pnpm-lock.yaml /app/pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 4242

CMD ["pnpm", "start:docker"]

FROM node:lts

WORKDIR /app

RUN npm install -g pnpm@11.5.2

COPY package.json /app/package.json
COPY pnpm-lock.yaml /app/pnpm-lock.yaml
COPY pnpm-workspace.yaml /app/pnpm-workspace.yaml

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 4242

CMD ["pnpm", "start:docker"]

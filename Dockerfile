# syntax = docker/dockerfile:1-labs

# This Dockerfile is designed for production, not development. Use with Kamal or build'n'run by hand:
# docker build -t my-app .
# docker run -d -p 80:80 -p 443:443 --name my-app -e RAILS_MASTER_KEY=<value from config/master.key> my-app

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=3.1.4
ARG APP=grit
FROM node:lts AS frontend

ARG APP
ENV APP_DIR=apps/${APP}/client
ENV APP_WORKDIR=/workspace/${APP_DIR}

WORKDIR /workspace

RUN npm install -g pnpm@10.0.0-alpha.4

COPY --parents package.json pnpm-workspace.yaml pnpm-lock.yaml ./**/package.json ./

RUN pnpm install --frozen-lockfile

COPY --parents ./**/frontend/**/* ./${APP_DIR}/**/* ./

WORKDIR ${APP_WORKDIR}

RUN pnpm build

FROM node:lts AS docs

WORKDIR /docs

RUN npm install -g pnpm@10.0.0-alpha.4

COPY grit-docs/package.json grit-docs/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY grit-docs .

RUN pnpm build

FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

ARG APP
ENV APP_DIR=apps/${APP}/server
ENV APP_WORKDIR=/rails/${APP_DIR}

# Rails app lives here
WORKDIR ${APP_WORKDIR}

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development"

# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install application gems without gems from source to avoid downloading all gems when modules change
COPY ${APP_DIR}/Gemfile ${APP_DIR}/Gemfile.lock ./
RUN BUNDLE_WITHOUT="local ${BUNDLE_WITHOUT}" bundle install

# Install application gems including gems from source and their dependencies
COPY --parents ./modules/**/backend/**/* /rails
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git

# Copy application code
COPY ${APP_DIR} .

# Final stage for app image
FROM base

# Copy built artifacts: gems, application, local modules
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build ${APP_WORKDIR} ${APP_WORKDIR}
COPY --from=build /rails/modules /rails/modules
COPY --from=frontend /workspace/apps/${APP}/client/dist ${APP_WORKDIR}/public
COPY --from=docs /docs/build ${APP_WORKDIR}/public/docs

# Run and own only the runtime files as a non-root user for security
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R rails:rails db log tmp
USER 1000:1000

# Entrypoint prepares the database.
ENTRYPOINT ["./bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["./bin/rails", "server"]

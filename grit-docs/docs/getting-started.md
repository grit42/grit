---
sidebar_position: 2
---

# Getting started

This guide can be used to run the grit Scientific Data Management System locally or on a remote server.

## Requirements

- [docker](https://docs.docker.com/get-started/get-docker/)
- [docker compose](https://docs.docker.com/compose/install/)

Before continuing, ensure the Docker daemon is running.

### Server requirements

grit has been shown to run smoothly on modest hardware such as [Hetzner CPX21](https://www.hetzner.com/cloud/) with over 200 millions data points.

Indicative requirements for less than 10 concurrent users:

- 2 vCPUs @ 3 GHz
- 4 GB RAM
- 40 GB storage

## Running the app

### Get the environment

1. Clone the [starter repo](https://github.com/grit42/grit-starter) or download and extract the [zip](https://github.com/grit42/grit-starter/archive/refs/heads/main.zip)
2. Copy the content of `.env.template` to `.env`
   - Some users may need to enable display of hidden files if using a file explorer

Subsequent steps of this guide are to be executed in the cloned repository or the extracted zip unless instructed otherwise.

### Start the database and app services

Run the following command in a terminal to start the application:

```sh
docker compose up
```

### Activate the admin user

The `admin` user must be activated to start using the application the first time it is started.

Navigate to `/app/core/activate/admin` (e.g. when running locally http://localhost:3000/app/core/activate/admin) to activate the `admin` user by configuring its password.

## User management

The admin user can add and manage other users.

Navigate to `/app/core/administration/user-management/users` (e.g. when running locally http://localhost:3000/app/core/administration/user-management/users) to add new users.

### Mail service configuration

User management can be handled manually by an administrator by copying activation and password reset links from the system and delivering them to users by preferred communication media, but the system can also be configured to automatically send emails to users.

To do this a SMTP mail service has to be configured.

The SMTP mail service can be configured through environment variables in the `.env` file.

The following variables are required:

```sh
# Mailer configuration
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_TOKEN=SMTP_TOKEN
SMTP_USER=user@example.com

# The URL at which grit is running
# used to build activation and password reset URLs
GRIT_SERVER_URL=https://grit.example.com
```

### Single Sign-On (SSO)

grit supports enterprise Single Sign-On via **SAML 2.0** or **OpenID Connect (OIDC)**. When enabled, a "Sign in with SSO" button appears on the login page. Users who authenticate through the Identity Provider (IdP) are automatically created in grit on first login.

Local login (username/password) always remains available alongside SSO, ensuring admin access if the IdP is unavailable.

SSO is configured through environment variables in the `.env` file. Set `SSO_PROVIDER` to enable it:

```sh
# SSO provider: "none" (default), "saml", or "oidc"
SSO_PROVIDER=none
```

#### SAML 2.0

The recommended approach is to point grit at the IdP metadata URL. grit
will automatically discover the SSO endpoint and signing certificate:

```sh
SSO_PROVIDER=saml

# IdP metadata URL — grit fetches the SSO URL and certificate from here
SAML_IDP_METADATA_URL=https://idp.example.com/saml/metadata

# Entity ID for grit as the Service Provider (optional, defaults to "grit")
# SAML_SP_ENTITY_ID=grit

# Name ID format (optional, defaults to unspecified)
# SAML_NAME_ID_FORMAT=urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified
```

Alternatively, you can configure the IdP SSO URL and certificate manually.
When both the metadata URL and explicit values are set, the explicit values
take precedence:

```sh
SSO_PROVIDER=saml

# URL of the IdP's SSO endpoint
SAML_IDP_SSO_URL=https://idp.example.com/saml/sso

# IdP signing certificate, PEM-encoded
# Can be a single-line string with literal \n for newlines
SAML_IDP_CERT="-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----"
```

#### OpenID Connect (OIDC)

```sh
SSO_PROVIDER=oidc

# OIDC issuer URL, e.g. https://accounts.google.com or
# https://login.microsoftonline.com/{tenant}/v2.0 (required)
OIDC_ISSUER=https://idp.example.com

# OAuth2 client credentials (required)
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Explicit callback URL (optional — derived from GRIT_SERVER_URL by default).
# Use this if you need to override the auto-derived value.
# OIDC_REDIRECT_URI=https://grit.example.com/api/grit/core/auth/oidc/callback
```

`GRIT_SERVER_URL` (or `OIDC_REDIRECT_URI`) must be set so the OIDC callback
URL matches what is registered in your Identity Provider. The callback URL is:

```
{GRIT_SERVER_URL}/api/grit/core/auth/oidc/callback
```

For SAML, the Assertion Consumer Service (ACS) URL is:

```
https://<your-grit-url>/api/grit/core/auth/saml/callback
```

## Maintaining the app

### Backup the database

It is a good idea to back up the database regularly and before upgrading.
If a backup already exists, it will be overwritten when making a new backup.

Run the following command to back up the database:

```sh
docker compose run --rm backup
```

### Restore the latest backup

Run the following command to restore the latest backup of the database:

```sh
docker compose run --rm restore
```

### Upgrading to a new version

New releases are announced in [Discussions](https://github.com/grit42/grit/discussions/categories/announcements) of the main repo on [GitHub](https://github.com/grit42/grit). Additional steps or warnings may be specified in the release announcement, please read it carefully before upgrading.

Run the following command to upgrade to the latest version:

```sh
docker compose pull app
docker compose up --no-deps --force-recreate app
```

## Upgrading from previous sample docker compose

1.  Ensure the values in the `.env` file match the environment in the compose file used to run the app before
2.  In the directory containing the new `docker-compose.yml` file, start the new `db` service to create the volume
    ```sh
    docker compose up -d db
    ```
3.  In the directory containing the previous `docker-compose.yml` file, copy database files into the volume using a helper container, for example on a Unix system:
    ```sh
    docker run --rm \
        -v ./postgres-data:/from \
        -v grit_postgres_data:/to \
        alpine \
        sh -c "cd /from && tar cf - . | tar xf - -C /to"
    ```
4.  Fix database files ownership
    ```sh
    docker run --rm \
      -v grit_postgres_data:/data \
      alpine \
      chown -R 999:999 /data
    ```

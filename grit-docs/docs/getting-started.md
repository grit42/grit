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

grit supports enterprise Single Sign-On via **OpenID Connect (OIDC)** or **SAML 2.0**. When enabled, a "Sign in with SSO" button appears on the login page. With OIDC, users who authenticate through the Identity Provider (IdP) are automatically created in grit on first login; with SAML, see below.

Local login (username/password) always remains available alongside SSO, ensuring admin access if the IdP is unavailable.

SSO is configured through environment variables in the `.env` file. Set `SSO_PROVIDER` to enable it:

```sh
# SSO provider: "none" (default), "oidc" or "saml"
SSO_PROVIDER=none
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

#### SAML 2.0

```sh
SSO_PROVIDER=saml

# The IdP's metadata URL (required). It's fetched on the first login and
# cached for a day; a failed login fetches it again, so a certificate
# rotation needs no restart, and grit starts while the IdP is down.
SAML_IDP_METADATA_URL=https://idp.example.com/saml/metadata

# The attribute carrying the user's e-mail (optional). Without it, or when a
# response lacks it, the usual e-mail attributes and then an e-mail NameID
# are used.
SAML_EMAIL_ATTRIBUTE=http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress

# What a login with an e-mail no grit user has does: "refuse" (default) or
# "create" (a user without roles, who sees "not authorized" until an
# administrator gives them roles).
# SAML_UNKNOWN_USERS=refuse

# Our entity id and callback (ACS) URL (optional: derived from
# GRIT_SERVER_URL by default).
# SAML_SP_ENTITY_ID=https://grit.example.com/api/grit/core/auth/saml/metadata
# SAML_ACS_URL=https://grit.example.com/api/grit/core/auth/saml/callback
```

Register grit at the IdP with its metadata, served at `{GRIT_SERVER_URL}/api/grit/core/auth/saml/metadata` (entity id and callback URL as above, NameID format `emailAddress`, HTTP-POST binding for the response). The IdP must sign its responses.

How SAML users are handled:

- **Users are found by e-mail**, not by NameID (which may change at every login). Only users whose login method is *Single sign-on (SAML)* are found: a SAML login can't log in as a local (password) account with the same e-mail.
- **New users** made in Administration → Users default to the SAML login method. They're active at once and get no activation e-mail. An administrator can still choose a local login, e.g. for a fallback account; `admin` always keeps its password.
- **The login page** offers "Sign in with SSO" first; a link opens the username and password form (or open `/app/core/authenticate?local`).
- **Logging out** ends the grit session only; there is no SAML single logout.

**Moving from the old Animals app:** to keep the IdP's existing registration, set `SAML_SP_ENTITY_ID=https://{host}/saml/metadata` and `SAML_ACS_URL=https://{host}/saml/consume`. The old `/saml/consume`, `/saml/metadata` and `/saml/init` paths keep working.

For a local IdP to try this with, see `db/keycloak/README.md`.

### Security configuration

grit provides optional security hardening features that can be enabled via environment variables in the `.env` file.

#### Login lockout

Accounts are locked after a configurable number of consecutive failed password attempts. When locked, the user receives an email with a reactivation link.

```sh
# Enable login lockout (default: false)
PASSWORD_LOCKOUT_ENABLED=true

# Number of consecutive failed attempts before lockout (default: 5)
PASSWORD_LOCKOUT_ATTEMPTS=5
```

The `admin` account is exempt from automatic lockout to ensure system access is never lost.

#### Password expiry

Passwords can be configured to expire after a set number of days. Users whose password has expired will be prompted to reset it via the forgotten password flow.

```sh
# Enable password expiry (default: false)
PASSWORD_EXPIRY_ENABLED=true

# Days before a password expires (default: 90)
PASSWORD_EXPIRY_DAYS=90
```

:::note
Password expiry applies only to local (non-SSO) accounts.
:::

#### Session expiry

Sessions can be configured to expire after a period of inactivity. Users with an expired session are redirected to the login page.

```sh
# Enable session expiry (default: false)
SESSION_EXPIRY_ENABLED=true

# Minutes of inactivity before a session expires (default: 60)
SESSION_EXPIRY_MINUTES=60
```

#### Failed login limit

The maximum number of consecutive failed login attempts tracked by the system can be adjusted:

```sh
# Maximum tracked consecutive failed logins (default: 50)
MAX_FAILED_LOGINS=50
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

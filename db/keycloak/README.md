# Local SAML identity provider (Keycloak)

A Keycloak with a `grit` realm set up for grit's SAML single sign-on on the local dev server (backend on 3000, Vite on 3001).

```bash
docker compose -f db/keycloak/docker-compose.yml up
```

Keycloak listens on http://localhost:8180 (admin console: `admin` / `admin`). The realm is imported at start; to start over after changing it in the console, `docker compose -f db/keycloak/docker-compose.yml down` and up again.

## grit settings

In `.env`:

```bash
SSO_PROVIDER=saml
GRIT_SERVER_URL=http://localhost:3001
SAML_IDP_METADATA_URL=http://localhost:8180/realms/grit/protocol/saml/descriptor
SAML_EMAIL_ATTRIBUTE=email
# SAML_UNKNOWN_USERS=create   # default: refuse logins with an e-mail no grit user has
```

Restart the backend after changing them.

## Test users

Password = username.

| Keycloak user | E-mail              | Use                                                                                                 |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `jane`        | jane@example.com    | Create a grit user with this e-mail and login method SAML: she logs in                              |
| `john`        | john@example.com    | Create him as a _local_ user: his SAML login is refused (an IdP can't log in as a password account) |
| `unknown`     | unknown@example.com | No grit user: refused, or created with `SAML_UNKNOWN_USERS=create`                                  |

Keycloak sends the e-mail both as the NameID and as the `email` attribute; remove `SAML_EMAIL_ATTRIBUTE` to try the NameID fallback (or remove the client's `email` mapper in the console).

The client is the SP entity id `http://localhost:3001/api/grit/core/auth/saml/metadata`; grit's own metadata is served there.

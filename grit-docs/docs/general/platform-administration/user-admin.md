---
sidebar_label: 'User administration'
sidebar_position: 1
---

# User administration

User accounts are managed by an _Administrator_ in the **Administration** section under the **User management** tab. _Administrators_ can create user accounts, updated user information, enable two-factor authentication, and deactivate accounts.

:::note
Account activation links, password reset links, and two-factor authentication tokens can be sent via email. To enable this, an email service must be configured as described in the [Installation Guide](/getting-started#mail-service-configuration).
:::

## Roles

Roles determine what users can do on the system. Each role grants a set of permissions to the users assigned to it.

There are 5 system roles, each building on the previous one:

| Role | Description |
| --- | --- |
| Read | Read data |
| Analyse | _Read_ and use analysis features |
| Write | _Analyse_ and write data |
| Manage | _Write_ and manage models and controlled terminology |
| Administrator | System administrator |

The permissions available on the system depend on the modules installed. It is also possible to define custom roles with a specific set of permissions to suit your organisation's needs.

## Creating user accounts

User accounts are created in the **Administration** section under the **Access** / **Users** tab by clicking the _New_ toolbar action.

![User administration tab](./assets/user_administration.png)

User accounts require:
1.  A login, must be unique
2.  A name
3.  An email address, must be unique
4.  An origin

Optionally:
5.  A location
6.  Enable two-factor authentication
7.  Roles

To create a user, fill in the form and click **Save**.

:::note
If an email service have been setup an email will be sent to the user. If not the admin must distribute the activation link found on the user detail page.
:::

:::note
Using the platform requires at a minimum the "read:system" permission to access the platform, for instance by configuring the _Read_ role.
:::

![User creation form](./assets/create_user.png)

## Editing user accounts

To edit a user account, such as updating the email address, enabling two-factor authentication, or assigning roles, select the account from the list under the User management view, make the necessary changes, and click Save.

Two-factor authentication will be required the next time the user logs in.
Role changes take effect immediately, but users may need to refresh the application for the changes to appear in the interface.

:::note
User login cannot be modified.
:::

![User update form with two-factor and roles highlighted](./assets/update_user.png)

## Deactivating user accounts

If a user's access to the system is revoked, their account can be deactivated. Deactivating an account prevents system access while preserving data integrity by retaining ownership records. A deactivated account can be reactivated at any time and will resume normal function using the last configured password.

Accounts can also be deactivated automatically if [login lockout](/getting-started#login-lockout) is enabled and the user exceeds the maximum number of failed login attempts. A locked account is treated the same as a manually deactivated one and can be reactivated in the same way. The user also receives an email with a reactivation link.

To deactivate a user account, click the account in the list under the **User management** view, toggle off the **Active** switch and click **Save**.

![User update form with active switch highlighted](./assets/deactivate_user.png)

## Manage tokens

### Activation token

A link can be copied to a form where a new user can activate its account (1). It is also possible to revoke the activation token (2).

![User update form with activation token highlighted](./assets/activation_token.png)

### Reset password token

A link to a form where a user can set a new password can be created and copied. It is also possible to revoke the password reset token. This can only be done for active users.

![User update form with password reset token highlighted](./assets/reset_password_token.png)

### API token

A field to copy a users API token can also be found. There is also an option to create a new token for a user.

![User update form with API token highlighted](./assets/api_token.png)

---
sidebar_label: 'User administration'
sidebar_position: 1
---

# User administration

User accounts are managed by an _Administrator_ in the **Administration** section under the **User management** tab. _Administrators_ can create user accounts, updated user information, enable two-factor authentication, and deactivate accounts.

:::note
Account activation links, password reset links, and two-factor authentication tokens are sent via email. An email service must be configured as described in the [Installation Guide](/docs/getting-started/installation.md) for these features to function properly.
:::

## Roles

Roles define what users can see and modify in the system. These roles are predefined and cannot be changed. Available roles depend on installed modules.

## Creating user accounts

User accounts are created in the **Administration** section under the **User management** tab by clicking the _New_ toolbar action.

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

:::note
Do not set the _active_ status of a user when creating an account, it will be set automatically when the user activate its account via the link received by email.
:::

To create a user, fill in the form and click **Save**. An email will be sent to the specified address with a link to activate the account by setting a password.

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

If a user's access to the system is revoked, their account can be deactivated. Deactivating an account prevents system access while preserving data integrity by retaining ownership records. A deactivated account can be reactivated at any time and will resume normal function using the last configured password

To deactivate a user account, click the account in the list under the **User management** view, toggle off the **Active** switch and click **Save**.

![User update form with active switch highlighted](./assets/deactivate_user.png)

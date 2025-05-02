---
sidebar_label: 'User administration'
sidebar_position: 3
---


# User administration

:::info

🚧 This section is under construction. 🚧

The initial start up will create/activate the admin user as described under [quick-start](../getting-started/quick-start.md).

The other users on the platform should be added by the admin and given a relevant role depending on the work they will do on the platform.

We will describe how to add these new "normal" user later when we get feedback from some of our first projects on the open source platform regarding the best way to ensure they can implement 2FA (see below).

:::

## We use a mailer for user activation and 2FA

When we (grit42) deploy the platform to a server and as admin's register new users from many different organisations (as we do in the big EU projects VICT3R, ERA4TB and COMBINE) we use a mailer feature.

As we add the user (with their email) the mailer sends the new user an activation email with a link to the platform. When clicking the link the user is sent to the platform and asked to add a password and activate the user account.

Hence, we as administrators, do not know their password, and it's encrypted in the database. Should they later forget the password there is a "forgot password" function.

If two-factor authentication (2FA) is activated (and you should!) as shown below 2) then the user, as they try to login to the platform, will get an email with a "token", which is a system generated number that they need to type into the frontend to be allowed access.


:::info

**Contact us if you are going to deploy to a server**

IF you already now plan to deploy the platform to a server and add more users, then contact us on **marvin@grit42.com**.

We will help you set up a mailer, so you can benefit from the activation and 2FA system, at no cost.

We may continue with the mailer solution - and then we will describe how to set it up here.

But a different way to implement adding users with activation and 2FA may be better. If we decide to change the method and implement 2FA differently, we will here describe how to deploy that

:::

![Showing new user reg form with 2FA](./assets/user_reg_new.png)








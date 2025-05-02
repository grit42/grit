# README

This README would normally document whatever steps are necessary to get the
application up and running.

Things you may want to cover:

* Ruby version

* System dependencies

* Configuration

* Database creation

* Database initialization

* How to run the test suite

* Services (job queues, cache servers, search engines, etc.)

* Deployment instructions

* ...

# Github token
Create a personal access token as described [here](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) and use it in place of `<your_github_token>` in the commands below

## Local install

```sh
bundle config --global https://github.com/grit42/grit-ce.git <your_github_token>
```

You can also use `--local` to limit the token to the current project

## Prod build

```sh
GITHUB_TOKEN=<your_github_token> docker build --secret id=GITHUB_TOKEN -t grit42com/grit-ce:latest .
```

---
sidebar_position: 1
---

# Quick start

:::warning[Caution]

The intent of this guide is to quickly launch a sandbox that you can use to evaluate the grit platform. This guide is not intended for production environments. For comprehensive setup instructions, see [Installation](installation).

:::

Run the grit platform via the provided Docker image:
1. Ensure docker is running on your machine, start it if it's not

```
docker info
```

2. Download the [docker compose file](./assets/docker-compose.yml) and put it in an empty directory somewhere

3. Go to the directory where you just added the docker-compose.yml file and run
```
docker compose pull
docker compose up
```

4. Navigate to http://localhost:3000/app/core/activate/admin the first time to set a password. Every subsequent time, navigate
to http://localhost:3000/

5. Enjoy!

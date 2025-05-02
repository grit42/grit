# Welcome to grit

## What is grit?

grit a scientific research data management platform. In the grit platform you can store, manage, and visualise data from all the pre-clinical drug discovery phases.

## Getting started

### Running grit locally

**The intent of this guide is to quickly launch a sandbox that you can use to evaluate the grit platform. This guide is not intended for production environments**

Run the grit platform via the provided Docker image:
1. Ensure docker is running on your machine, start it if it's not

```
docker info
```

2. Download the [docker compose file](https://raw.githubusercontent.com/grit42/grit/refs/heads/main/docker-compose.yml) and put it in an empty directory somewhere

3. Go to the directory where you just added the docker-compose.yml file and run
```
docker compose pull
docker compose up
```

4. Navigate to http://localhost:3000/app/core/activate/admin the first time to set a password. Every subsequent time, navigate
to http://localhost:3000/

5. Enjoy!

### Running grit in production

As we are transitioning to a new way of distributing our software, the configuration of a production instance of grit is not yet straightforward. If you are interested in running grit in production, we encourage you to get in touch with us at [marvin@grit42.com](mailto:marvin@grit42.com).

## Contributing

Please check out [CONTRIBUTING](./CONTRIBUTING.md)

## License

grit is released under the [GNU General Public License version 3](https://opensource.org/license/gpl-3-0).

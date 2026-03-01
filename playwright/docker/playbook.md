# A notebook with useful commands

## Build the test container

```bash
docker build -t jellyfin-test -f Dockerfile ../../
```

## Run the test container

Although we are using single container, we are using docker compose, because it is easier to provide configuration and environment variables.

```bash
docker compose up
```

Execute a command inside the text container:

```bash
docker exec -it jellyfin-test ./jellyfin --help
docker exec -it jellyfin-test curl http://localhost:8080
```
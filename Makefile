
all: build up

build:
		docker compose build
up:
		docker compose up -d
down:
		docker compose down
clean:
		docker compose down --volumes
re: down all
.PHONY: all build up down cleans
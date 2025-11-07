
all: build up

build:
		docker compose build
up:
		docker compose up -d
down:
		docker compose down
clean:
		docker compose down --volumes

# hierna even een nieuwe terminal openen.
nodeV:
	curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
	export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
	npm install -g npm@11.6.2
# cd fastify-ws-docker
# npm run dev

re: down all
.PHONY: all build up down cleans
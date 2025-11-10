
all: build up

build:
		docker compose build
up:
		docker compose up -d
down:
		docker compose down
clean: kill-ngrok
		docker compose down --volumes
		rm -rf ./backend/data
		rm -rf ./backend/dist
		rm -rf ./node_modules

ngrok:
		npm install ngrok
		./node_modules/.bin/ngrok config add-authtoken 34hJ1Eb9BW0CxXEtYKAiG3j0tdm_3FWVar2HWBSqhRQMDxCVk
		./node_modules/.bin/ngrok http 8080
kill-ngrok:
		pkill -f ngrok

allclean: clean
# Stop and remove all containers, networks, and volumes defined in your compose file
	docker compose down -v
# If you want to remove images as well
	docker compose down -v --rmi all
# Additional cleanup commands if needed	:
# Remove all stopped containers
	docker container prune -f
# Remove all unused networks
	docker network prune -f
# Remove all unused volumes
	docker volume prune -f
# Remove all unused images
	docker image prune -a -f
# Nuclear option - remove EVERYTHING (use with caution)
	docker system prune -a --volumes -f

# hierna even een nieuwe terminal openen.
nodeV:
	curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
	export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
	npm install -g npm@11.6.2
# cd fastify-ws-docker
# npm run dev

re: down all
.PHONY: all build up down cleans


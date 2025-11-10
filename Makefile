
all: build up

build: ngrok_install ngrok
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

ngrok_install:
	@if [ ! -f ./node_modules/.bin/ngrok ]; then \
		echo "Installing ngrok..."; \
		npm install ngrok; \
		./node_modules/.bin/ngrok config add-authtoken 34hJ1Eb9BW0CxXEtYKAiG3j0tdm_3FWVar2HWBSqhRQMDxCVk; \
		echo "ngrok installed and configured!"; \
	else \
		echo "ngrok already installed"; \
	fi

ngrok: kill-ngrok
	@echo "Starting ngrok tunnel on port 8080..."
	@./node_modules/.bin/ngrok http 8080 > /dev/null 2>&1 &
	@sleep 2
	@echo "ngrok started in background"
	@echo "Check status: http://localhost:4040"

ngrok-url:
	@curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' || echo "ngrok not running"

kill-ngrok:
	@if pgrep -x ngrok > /dev/null; then \
		pkill ngrok && echo "ngrok killed"; \
	fi

clean: kill-ngrok
	docker compose down --volumes
	rm -rf ./backend/data
	rm -rf ./backend/dist
	rm -rf ./node_modules
	rm -rf ./frontend/node_modules
	rm -rf ./backend/node_modules
		
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
.PHONY: all build up down ngrok_install ngrok ngrok-url kill-ngrok clean allclean nodeV re
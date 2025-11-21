
all: build up

build: ngrok_install ngrok
	docker compose build

up:
	docker compose up -d

down: kill-ngrok
	docker compose down

db-rm:
	@echo "Resetting database..."
	rm -rf backend/prisma/database/

ngrok_install:
	./setup_ngrok.sh

ngrok:
	@if [ ! -f .env ]; then \
		echo "ERROR: .env file not found!"; \
		exit 1; \
	fi

	@if pgrep -x ngrok > /dev/null; then \
        echo "ngrok is already running"; \
        echo "Current tunnel:"; \
        make ngrok-url; \
    else \
        echo "Starting ngrok tunnel on port 8080..."; \
        ./node_modules/.bin/ngrok http 8080 > /dev/null 2>&1 & \
        sleep 2; \
        echo "ngrok started in background"; \
        echo "Check status: http://localhost:4040"; \
        make ngrok-url; \
    fi

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
	rm -rf ./node_modules
	rm -rf ./package-lock.json
	rm -rf ./backend/package-lock.json
	rm -rf ./frontend/package-lock.json
		
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
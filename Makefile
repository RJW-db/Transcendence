ifeq (,$(wildcard .env))
$(error ERROR: .env file not found!)
endif

-include .env
export

all: build up
	@sleep 0.5
	@printf "\nApplication is running!\n  Local:  http://localhost:8080\n  Online: %s\n\n" "$(NGROK_SITE)"

build: ngrok
	docker compose build

up:
	docker compose up -d

down: kill-ngrok
	docker compose down

setup-ngrok:
	@if [ ! -f ./node_modules/.bin/ngrok ]; then \
		echo "Installing ngrok..."; \
		npm install ngrok; \
	fi
	@./node_modules/.bin/ngrok config add-authtoken $(NGROK_AUTHTOKEN)

ngrok: setup-ngrok
	@if ! pgrep -x ngrok > /dev/null; then \
		echo "Starting ngrok tunnel on port 8080..."; \
		./node_modules/.bin/ngrok http 8080 > /dev/null 2>&1 & \
		sleep 2; \
		echo "ngrok started in background"; \
		echo "Check status: http://localhost:4040"; \
	fi
	@printf "Tunnel URL: %s\n" "$(NGROK_SITE)"

ngrok-url:
	@printf "ngrok URL: %s\n" "$(NGROK_SITE)"

kill-ngrok:
	@if pgrep -x ngrok > /dev/null; then \
		pkill ngrok && echo "ngrok killed"; \
	fi

log:
	docker-compose logs -f

db-rm:
	@echo "Resetting database..."
	rm -rf backend/prisma/database/

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
		
fclean: clean

allclean: fclean db-rm
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

.PHONY: all build up down setup-ngrok ngrok ngrok-url kill-ngrok log db-rm clean fclean allclean nodeV re

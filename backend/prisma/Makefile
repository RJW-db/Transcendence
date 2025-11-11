DB_NAME = database/pong_tournament.db
SCHEMA = config/pong_schema.sql
TESTDATA = config/test_data.sql

.PHONY: all clean fclean test_data build start dev run-schema re

all:
	make $(DB_NAME)
	npx prisma generate
# 	npm run build
# 	npm run start

$(DB_NAME): $(SCHEMA)
	mkdir -p database
	sqlite3 $(DB_NAME) < $(SCHEMA)

# test_data:
# 	make $(DB_NAME)
# 	npx prisma generate
# 	npm run build
# 	sqlite3 $(DB_NAME) < $(TESTDATA)

# 	npm run start

run-schema:
	sqlite3 $(DB_NAME) < $(SCHEMA)

build:
	mkdir -p dist
	npx prisma generate
	npm run build

start:
	npx prisma generate && npm run build && npm run start

clean:
	rm -rf dist
	rm -rf src/generated/prisma/*

fclean:
	rm -rf dist
	rm -rf src/generated/prisma/*
	rm -rf database

re: fclean all
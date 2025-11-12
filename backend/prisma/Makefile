DB_NAME = database/pong_tournament.db
SCHEMA = config/pong_schema.sql
TESTDATA = config/test_data.sql

.PHONY: all clean fclean run-schema re

all: $(DB_NAME)
	cd .. && npx --yes prisma generate
	cd .. && npx --yes prisma db push --force-reset --skip-generate

$(DB_NAME): $(SCHEMA)
	mkdir -p database
	sqlite3 $(DB_NAME) < $(SCHEMA)

run-schema:
	sqlite3 $(DB_NAME) < $(SCHEMA)

clean:
	rm -rf ../node_modules/.prisma
	rm -rf ../node_modules/@prisma/client

fclean: clean
	rm -rf database

re: fclean all
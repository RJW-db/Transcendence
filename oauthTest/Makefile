DB_NAME = database/pong_tournament.db
SCHEMA = config/pong_schema.sql

db:
	make $(DB_NAME)
	npx prisma generate
	

$(DB_NAME): $(SCHEMA)
	mkdir -p database
	sqlite3 $(DB_NAME) < $(SCHEMA)

run-schema:
	sqlite3 $(DB_NAME) < $(SCHEMA)
build:
	docker-compose -f docker-compose.yml down --remove-orphans && docker-compose -f docker-compose.yml up -d --build --remove-orphans

up:
	docker-compose -f docker-compose.yml stop && docker-compose -f docker-compose.yml up -d --remove-orphans
	
down:
	docker compose down
docker-up:
	docker compose --env-file ./envs/main.env up -d

docker-node:
	docker compose --env-file ./envs/main.env up nginx rust-backend postgres migrate redis minio -d

docker-down:
	docker compose down

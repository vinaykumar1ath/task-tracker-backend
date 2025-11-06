.PHONY: build-todolist-backend-docker-1
build-todolist-backend-docker-1:
	docker build -t todolist/todolist-backend:docker-1 \
		-f ~/project/todolist-app/todolist-backend/Dockerfile.docker-1 \
	       	~/project/todolist-app/todolist-backend/

#.PHONY: build-todolist-backend-2
#build-todolist-backend-2:
#	docker build -t todolist-backend:2 \
		-f ~/project/todolist-app/todolist-backend/Dockerfile.2 \
	       	~/project/todolist-app/todolist-backend/

.PHONY: run-todolist-backend-docker-1
run-todolist-backend-docker-1:
	docker run --name todolist-backend \
		-p 3000:3000 \
		--network backend \
		--rm \
		todolist-backend:docker-1

.PHONY: run-todolist-db
run-todolist-db:
	docker run --name todolist-db \
		--network backend \
		--rm \
		-v todolist-mongodb:/data/db \
		mongo:8.2.1

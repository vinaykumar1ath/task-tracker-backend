.PHONY: build-task-tracker-backend-local
build-task-tracker-backend-local:
	docker build -t task-tracker/task-tracker-backend:local \
		-f ./Dockerfile.local \
	       	.

.PHONY: run-task-tracker-backend-local
run-task-tracker-backend-local:
	docker run --name task-tracker-backend \
		-p 3000:3000 \
		--network backend \
		--rm \
		task-tracker/task-tracker-backend:local

.PHONY: run-task-tracker-db-local
run-task-tracker-db-local:
	docker run --name task-tracker-db \
		--network backend \
		--rm \
		-v task-tracker-mongodb:/data/db \
		official/mongo:8.2.1
	
.PHONY: stop-task-tracker-local
stop-task-tracker-local:
	docker stop task-tracker-backend && \
	docker stop task-tracker-db

default_target: local

COMMIT_HASH := $(shell git log -1 --pretty=format:"%h"|tail -1)
VERSION = 0.18.0
IMAGE_REPO ?= ghcr.io/blakeblackshear/frigate
GITHUB_REF_NAME ?= $(shell git rev-parse --abbrev-ref HEAD)
DIST_ROOT ?= dist
DIST_VERSION = $(VERSION)-$(COMMIT_HASH)
BOARDS= #Initialized empty
FRIGATE_BOARD ?= intel
FRIGATE_COMPOSE = docker compose -f docker-compose.yml -f docker/compose/frigate.$(FRIGATE_BOARD).yml
SUPPORTED_FRIGATE_BOARDS = intel amd hailo rockchip

include docker/*/*.mk

BOARD ?= rk

board-build: board-build-$(BOARD)
board-build-rockchip: board-build-rk

board-build-intel: version
	@mkdir -p $(DIST_ROOT)/$(DIST_VERSION)/intel
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--platform linux/amd64 --tag frigate:$(DIST_VERSION)-intel \
		--output=type=docker,dest=$(DIST_ROOT)/$(DIST_VERSION)/intel/frigate-intel.tar
	python3 docker/build_distribution.py --board intel --compatibility intel \
		--version $(DIST_VERSION) --image-tag frigate:$(DIST_VERSION)-intel \
		--image-tar $(DIST_ROOT)/$(DIST_VERSION)/intel/frigate-intel.tar \
		--output-root $(DIST_ROOT)

board-build-amd: version
	@mkdir -p $(DIST_ROOT)/$(DIST_VERSION)/amd
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--platform linux/amd64 --tag frigate:$(DIST_VERSION)-amd \
		--output=type=docker,dest=$(DIST_ROOT)/$(DIST_VERSION)/amd/frigate-amd.tar
	python3 docker/build_distribution.py --board amd --compatibility amd \
		--version $(DIST_VERSION) --image-tag frigate:$(DIST_VERSION)-amd \
		--image-tar $(DIST_ROOT)/$(DIST_VERSION)/amd/frigate-amd.tar \
		--output-root $(DIST_ROOT)

board-build-hailo: version
	@mkdir -p $(DIST_ROOT)/$(DIST_VERSION)/hailo
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--platform linux/amd64 --tag frigate:$(DIST_VERSION)-hailo \
		--output=type=docker,dest=$(DIST_ROOT)/$(DIST_VERSION)/hailo/frigate-hailo.tar
	python3 docker/build_distribution.py --board hailo --compatibility hailo \
		--version $(DIST_VERSION) --image-tag frigate:$(DIST_VERSION)-hailo \
		--image-tar $(DIST_ROOT)/$(DIST_VERSION)/hailo/frigate-hailo.tar \
		--output-root $(DIST_ROOT)

build-boards: $(BOARDS:%=build-%)

push-boards: $(BOARDS:%=push-%)

version:
	echo 'VERSION = "$(VERSION)-$(COMMIT_HASH)"' > frigate/version.py
	echo 'VITE_GIT_COMMIT_HASH=$(COMMIT_HASH)' > web/.env

local: version
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--tag frigate:latest \
		--load

debug: version
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
	    --build-arg DEBUG=true \
		--tag frigate:latest \
		--load

amd64:
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--tag $(IMAGE_REPO):$(VERSION)-$(COMMIT_HASH) \
		--platform linux/amd64

arm64:
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--tag $(IMAGE_REPO):$(VERSION)-$(COMMIT_HASH) \
		--platform linux/arm64

build: version amd64 arm64
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--tag $(IMAGE_REPO):$(VERSION)-$(COMMIT_HASH) \
		--platform linux/arm64/v8,linux/amd64

push: push-boards
	docker buildx build --target=frigate --file docker/main/Dockerfile . \
		--tag $(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH) \
		--platform linux/arm64/v8,linux/amd64 \
		--push

run: local
	docker run --rm --publish=5000:5000 --publish=8971:8971 \
		--volume=${PWD}/config:/config frigate:latest

run_tests: local
	docker run --rm --workdir=/opt/frigate --entrypoint= frigate:latest \
		python3 -u -m unittest
	docker run --rm --workdir=/opt/frigate --entrypoint= frigate:latest \
		python3 -u -m mypy --config-file frigate/mypy.ini frigate

setup-dev-intel:
	python3 docker/compose/detect_hardware.py --board intel
	@mkdir -p .devcontainer
	@cp .env .devcontainer/.env

dev-intel: setup-dev-intel
	devcontainer up --workspace-folder .

$(SUPPORTED_FRIGATE_BOARDS:%=generate-config-%): generate-config-%:
	python3 docker/compose/detect_hardware.py --board $* --config-only

$(SUPPORTED_FRIGATE_BOARDS:%=setup-frigate-%): setup-frigate-%:
	python3 docker/compose/detect_hardware.py --board $*

$(SUPPORTED_FRIGATE_BOARDS:%=frigate-%): frigate-%: setup-frigate-%
	$(MAKE) frigate-up FRIGATE_BOARD=$*

$(SUPPORTED_FRIGATE_BOARDS:%=frigate-config-%): frigate-config-%:
	$(MAKE) frigate-config FRIGATE_BOARD=$*

$(SUPPORTED_FRIGATE_BOARDS:%=frigate-down-%): frigate-down-%:
	$(MAKE) frigate-down FRIGATE_BOARD=$*

frigate-up:
	$(FRIGATE_COMPOSE) up -d

frigate-config:
	$(FRIGATE_COMPOSE) config

frigate-down:
	$(FRIGATE_COMPOSE) down

.PHONY: run_tests setup-dev-intel dev-intel frigate-up frigate-config frigate-down board-build
.PHONY: board-build-intel board-build-amd board-build-hailo board-build-rockchip
.PHONY: $(SUPPORTED_FRIGATE_BOARDS:%=generate-config-%)
.PHONY: $(SUPPORTED_FRIGATE_BOARDS:%=setup-frigate-%)
.PHONY: $(SUPPORTED_FRIGATE_BOARDS:%=frigate-%)
.PHONY: $(SUPPORTED_FRIGATE_BOARDS:%=frigate-config-%)
.PHONY: $(SUPPORTED_FRIGATE_BOARDS:%=frigate-down-%)

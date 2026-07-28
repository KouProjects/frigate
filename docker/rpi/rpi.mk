BOARDS += rpi

local-rpi: version
	docker buildx bake --file=docker/rpi/rpi.hcl rpi \
		--set rpi.tags=frigate:latest-rpi \
		--load

build-rpi: version
	docker buildx bake --file=docker/rpi/rpi.hcl rpi \
		--set rpi.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-rpi

board-build-rpi: version
	@mkdir -p $(DIST_ROOT)/$(DIST_VERSION)/rpi
	docker buildx bake --file=docker/rpi/rpi.hcl rpi \
		--set rpi.tags=frigate:$(DIST_VERSION)-rpi \
		--set rpi.output=type=docker,dest=$(DIST_ROOT)/$(DIST_VERSION)/rpi/frigate-rpi.tar
	python3 docker/build_distribution.py --board rpi --compatibility rpi \
		--version $(DIST_VERSION) --image-tag frigate:$(DIST_VERSION)-rpi \
		--image-tar $(DIST_ROOT)/$(DIST_VERSION)/rpi/frigate-rpi.tar \
		--output-root $(DIST_ROOT)

push-rpi: build-rpi
	docker buildx bake --file=docker/rpi/rpi.hcl rpi \
		--set rpi.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-rpi \
		--push

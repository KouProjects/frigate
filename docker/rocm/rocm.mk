BOARDS += rocm

local-rocm: version
	docker buildx bake --file=docker/rocm/rocm.hcl rocm \
		--set rocm.tags=frigate:latest-rocm \
		--load

build-rocm: version
	docker buildx bake --file=docker/rocm/rocm.hcl rocm \
		--set rocm.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-rocm

board-build-rocm: version
	@mkdir -p $(DIST_ROOT)/$(DIST_VERSION)/rocm
	docker buildx bake --file=docker/rocm/rocm.hcl rocm \
		--set rocm.tags=frigate:$(DIST_VERSION)-rocm \
		--set rocm.output=type=docker,dest=$(DIST_ROOT)/$(DIST_VERSION)/rocm/frigate-rocm.tar
	python3 docker/build_distribution.py --board rocm --compatibility amd \
		--version $(DIST_VERSION) --image-tag frigate:$(DIST_VERSION)-rocm \
		--image-tar $(DIST_ROOT)/$(DIST_VERSION)/rocm/frigate-rocm.tar \
		--output-root $(DIST_ROOT)

push-rocm: build-rocm
	docker buildx bake --file=docker/rocm/rocm.hcl rocm \
		--set rocm.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-rocm \
		--push

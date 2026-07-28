BOARDS += synaptics

local-synaptics: version
	docker buildx bake --file=docker/synaptics/synaptics.hcl synaptics \
		--set synaptics.tags=frigate:latest-synaptics \
		--load

build-synaptics: version
	docker buildx bake --file=docker/synaptics/synaptics.hcl synaptics \
		--set synaptics.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-synaptics

board-build-synaptics: version
	@mkdir -p $(DIST_ROOT)/$(DIST_VERSION)/synaptics
	docker buildx bake --file=docker/synaptics/synaptics.hcl synaptics \
		--set synaptics.tags=frigate:$(DIST_VERSION)-synaptics \
		--set synaptics.output=type=docker,dest=$(DIST_ROOT)/$(DIST_VERSION)/synaptics/frigate-synaptics.tar
	python3 docker/build_distribution.py --board synaptics --compatibility synaptics \
		--version $(DIST_VERSION) --image-tag frigate:$(DIST_VERSION)-synaptics \
		--image-tar $(DIST_ROOT)/$(DIST_VERSION)/synaptics/frigate-synaptics.tar \
		--output-root $(DIST_ROOT)

push-synaptics: build-synaptics
	docker buildx bake --file=docker/synaptics/synaptics.hcl synaptics \
		--set synaptics.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-synaptics \
		--push

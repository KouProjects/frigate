BOARDS += rk

local-rk: version
	docker buildx bake --file=docker/rockchip/rk.hcl rk \
		--set rk.tags=frigate:latest-rk \
		--load

build-rk: version
	docker buildx bake --file=docker/rockchip/rk.hcl rk \
		--set rk.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-rk

board-build-rk: version
	@mkdir -p $(DIST_ROOT)/$(DIST_VERSION)/rk
	docker buildx bake --file=docker/rockchip/rk.hcl rk \
		--set rk.tags=frigate:$(DIST_VERSION)-rk \
		--set rk.output=type=docker,dest=$(DIST_ROOT)/$(DIST_VERSION)/rk/frigate-rk.tar
	python3 docker/build_distribution.py --board rk --compatibility rockchip \
		--version $(DIST_VERSION) --image-tag frigate:$(DIST_VERSION)-rk \
		--image-tar $(DIST_ROOT)/$(DIST_VERSION)/rk/frigate-rk.tar \
		--output-root $(DIST_ROOT)

push-rk: build-rk
	docker buildx bake --file=docker/rockchip/rk.hcl rk \
		--set rk.tags=$(IMAGE_REPO):${GITHUB_REF_NAME}-$(COMMIT_HASH)-rk \
		--push

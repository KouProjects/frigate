---
id: local-hardware-workflow
title: Local hardware development workflow
---

The development container and the Frigate runtime use separate Docker Compose
files. This prevents device mappings for a deployment board from leaking into
the developer workstation.

## Intel development workstation

The default development workflow targets an x86_64 Intel workstation. Run the
setup target before opening the repository in the development container:

```bash
make setup-dev-intel
```

The setup detects the host GPU device groups, writes their numeric group IDs
to the ignored `.env` file, and synchronizes it to `.devcontainer/.env` for
Compose interpolation. VS Code then uses
`.devcontainer/docker-compose.yml`, which maps only `/dev/dri`. Rockchip devices
such as `/dev/mpp_service` are not required on the Intel workstation.

The development container sets `CONFIG_FILE=/config/config.yml`. Board-specific
configs remain available for deployment and are generated separately by the
board setup targets.

If the Dev Container CLI is installed, setup and container startup can be run
together:

```bash
make dev-intel
```

## Frigate service targets

The common service configuration is in `docker-compose.yml`. Hardware-specific
settings are isolated under `docker/compose/`.

| Target | Image default | Devices |
| --- | --- | --- |
| `intel` | `frigate:latest` | `/dev/dri` |
| `amd` | `frigate:latest-rocm` | `/dev/dri`, `/dev/kfd` |
| `hailo` | `frigate:latest` | `/dev/hailo0` |
| `rockchip` | `frigate:latest-rk` | `/dev/dri`, `/dev/dma_heap`, `/dev/mpp_service`, `/dev/rga` |

Run the target on the machine that owns the accelerator. The setup step fails
when required device nodes or the requested GPU vendor are not detected.
It also creates the selected application config from its `.example` template
when the local file does not exist. Existing configs are never overwritten:

- Intel: `config/config.intel.yml`
- AMD: `config/config.amd.yml`
- Hailo: `config/config.hailo.yml`
- Rockchip: `config/config.rockchip.yml`

Each generated board config includes a `ppe_area` debug camera backed by
`debug/ppe-area.mp4`. The generator creates the `debug` directory and moves the
root-level clip there when necessary. Docker mounts that directory read-only at
`/media/frigate/debug`.

go2rtc loops the MP4 with FFmpeg and publishes it as the local
`ppe_area` RTSP stream. Frigate consumes that stream with
`preset-rtsp-restream`. Recordings and snapshots are disabled for the debug
camera.

The Rockchip config uses the automatically downloaded
`deci-fp16-yolonas_s` model. Intel and AMD use the YOLO-NAS ONNX configuration
from the Frigate documentation and expect the exported model at
`config/model_cache/yolo_nas_s.onnx`. Hailo keeps its supported automatically
selected Hailo model because the standard Hailo integration does not provide a
default YOLO-NAS model.

The go2rtc `exec` source is disabled by default in Frigate. The development and
runtime Compose files enable it explicitly with
`GO2RTC_ALLOW_ARBITRARY_EXEC=true` for this trusted local debug configuration.

Generate or inspect a deployment config from a workstation that does not own
the target accelerator:

```bash
make generate-config-rockchip
make frigate-config-rockchip
```

`generate-config-*` does not perform hardware validation. Starting Frigate
still performs the board-specific validation.

```bash
# On the Rockchip deployment board
make frigate-rockchip

# On other supported hosts
make frigate-intel
make frigate-amd
make frigate-hailo
```

Inspect the merged configuration without starting the service:

```bash
make frigate-config-rockchip
```

Configuration inspection does not perform local hardware detection, so it can
be run from the Intel workstation for any deployment board.

Stop a board-specific stack with the matching target:

```bash
make frigate-down-rockchip
```

Set `FRIGATE_IMAGE` to use a registry image instead of a locally built image:

```bash
FRIGATE_IMAGE=ghcr.io/blakeblackshear/frigate:stable-rk \
  make frigate-rockchip
```

An alternate application config can be selected without editing Compose:

```bash
FRIGATE_CONFIG_FILE=/config/config.test.yml make frigate-intel
```

The board configuration and the application `config/config.yml` are separate
concerns. The Compose selection grants access to hardware. Detector and FFmpeg
presets still belong in the Frigate application configuration.

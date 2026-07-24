#!/usr/bin/env python3
"""Detect host accelerator devices and write Docker Compose group settings."""

from __future__ import annotations

import argparse
import grp
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys

SUPPORTED_BOARDS = ("intel", "amd", "hailo", "rockchip")
MANAGED_KEYS = (
    "FRIGATE_RENDER_GID",
    "FRIGATE_VIDEO_GID",
    "FRIGATE_DEVICE_GID",
)
REQUIRED_DEVICES = {
    "intel": (Path("/dev/dri"),),
    "amd": (Path("/dev/dri"), Path("/dev/kfd")),
    "hailo": (Path("/dev/hailo0"),),
    "rockchip": (
        Path("/dev/dri"),
        Path("/dev/dma_heap"),
        Path("/dev/mpp_service"),
        Path("/dev/rga"),
    ),
}
CONFIG_NAMES = {
    "intel": "config.intel.yml",
    "amd": "config.amd.yml",
    "hailo": "config.hailo.yml",
    "rockchip": "config.rockchip.yml",
}


def read_pci_devices() -> str:
    """Return lower-case PCI device information when lspci is available."""
    try:
        result = subprocess.run(
            ["lspci", "-nn"],
            check=True,
            capture_output=True,
            text=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return ""

    return result.stdout.lower()


def validate_board(board: str, device_root: Path) -> list[Path]:
    """Validate the selected board and return resolved required device paths."""
    architecture = platform.machine().lower()
    if board in ("intel", "amd") and architecture not in ("x86_64", "amd64"):
        raise RuntimeError(f"{board} requires an x86_64 host")
    if board == "rockchip" and architecture not in ("aarch64", "arm64"):
        raise RuntimeError("Rockchip requires an arm64 host")

    devices = [
        device_root / path.relative_to("/") for path in REQUIRED_DEVICES[board]
    ]
    missing = [path for path in devices if not path.exists()]
    if missing:
        paths = ", ".join(str(path) for path in missing)
        raise RuntimeError(f"{board} requires missing device path(s): {paths}")

    pci_devices = read_pci_devices()
    display_devices = "\n".join(
        line
        for line in pci_devices.splitlines()
        if any(device_class in line for device_class in ("vga", "3d", "display"))
    )
    if board == "intel" and not list(devices[0].glob("renderD*")):
        raise RuntimeError("no DRM render node was detected under /dev/dri")
    if (
        board == "intel"
        and display_devices
        and "intel corporation" not in display_devices
    ):
        raise RuntimeError("no Intel PCI device was detected")
    if board == "amd" and display_devices:
        has_amd = (
            "advanced micro devices" in display_devices
            or "amd/ati" in display_devices
        )
        if not has_amd:
            raise RuntimeError("no AMD PCI device was detected")
    return devices


def group_id(name: str, fallback: int) -> int:
    """Return a host group ID, falling back when the group is unavailable."""
    try:
        return grp.getgrnam(name).gr_gid
    except KeyError:
        return fallback


def device_group_id(paths: list[Path], fallback: int) -> int:
    """Return the group ID of the first accelerator device node."""
    candidates: list[Path] = []
    for path in paths:
        if path.name == "dri":
            candidates.extend(sorted(path.glob("renderD*")))
        else:
            candidates.append(path)

    for path in candidates:
        try:
            return path.stat().st_gid
        except FileNotFoundError:
            continue

    return fallback


def update_env_file(path: Path, values: dict[str, int]) -> None:
    """Update only managed hardware variables in an environment file."""
    existing = path.read_text().splitlines() if path.exists() else []
    preserved = [
        line
        for line in existing
        if not any(line.startswith(f"{key}=") for key in MANAGED_KEYS)
    ]
    generated = [f"{key}={values[key]}" for key in MANAGED_KEYS]
    content = "\n".join([*preserved, *generated]) + "\n"
    path.write_text(content)


def ensure_board_config(board: str, config_dir: Path) -> Path:
    """Create a board application config without overwriting local settings."""
    config_path = config_dir / CONFIG_NAMES[board]
    if config_path.exists():
        return config_path

    example_path = config_path.with_name(f"{config_path.name}.example")
    if not example_path.exists():
        raise RuntimeError(f"missing configuration template: {example_path}")
    shutil.copyfile(example_path, config_path)
    return config_path


def ensure_debug_media(debug_dir: Path, video_path: Path) -> Path:
    """Ensure the debug video is available in the mounted debug directory."""
    debug_dir.mkdir(parents=True, exist_ok=True)
    destination = debug_dir / video_path.name
    if destination.exists():
        return destination
    if not video_path.exists():
        raise RuntimeError(
            f"missing debug video: expected {video_path} or {destination}"
        )
    shutil.move(video_path, destination)
    return destination


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--board", required=True, choices=SUPPORTED_BOARDS)
    parser.add_argument("--env-file", type=Path, default=Path(".env"))
    parser.add_argument("--config-dir", type=Path, default=Path("config"))
    parser.add_argument("--debug-dir", type=Path, default=Path("debug"))
    parser.add_argument("--debug-video", type=Path, default=Path("ppe-area.mp4"))
    parser.add_argument(
        "--config-only",
        action="store_true",
        help="generate board config and debug media without checking hardware",
    )
    parser.add_argument(
        "--device-root",
        type=Path,
        default=Path(os.environ.get("FRIGATE_DEVICE_ROOT", "/")),
        help=argparse.SUPPRESS,
    )
    return parser.parse_args()


def main() -> int:
    """Detect the selected hardware and persist its Docker group IDs."""
    args = parse_args()
    try:
        config_path = ensure_board_config(args.board, args.config_dir)
        debug_video = ensure_debug_media(args.debug_dir, args.debug_video)
    except RuntimeError as error:
        print(f"Configuration setup failed: {error}", file=sys.stderr)
        return 1

    if args.config_only:
        print(
            f"Generated {args.board}: "
            f"config={config_path}, "
            f"debug_video={debug_video}"
        )
        return 0

    try:
        devices = validate_board(args.board, args.device_root)
    except RuntimeError as error:
        print(f"Hardware detection failed: {error}", file=sys.stderr)
        return 1

    render_gid = group_id("render", 109)
    video_gid = group_id("video", 44)
    values = {
        "FRIGATE_RENDER_GID": device_group_id(devices, render_gid),
        "FRIGATE_VIDEO_GID": video_gid,
        "FRIGATE_DEVICE_GID": device_group_id(devices, video_gid),
    }
    update_env_file(args.env_file, values)
    print(
        f"Configured {args.board}: "
        f"render={values['FRIGATE_RENDER_GID']}, "
        f"video={values['FRIGATE_VIDEO_GID']}, "
        f"device={values['FRIGATE_DEVICE_GID']}, "
        f"config={config_path}, "
        f"debug_video={debug_video}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

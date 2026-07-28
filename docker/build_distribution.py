#!/usr/bin/env python3
"""Create a self-contained Frigate distribution directory for a board image."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil


CONFIG_SOURCES = {
    "intel": "config/config.intel.yml.example",
    "amd": "config/config.amd.yml.example",
    "rocm": "config/config.amd.yml.example",
    "hailo": "config/config.hailo.yml.example",
    "rockchip": "config/config.rockchip.yml.example",
    "rk": "config/config.rockchip.yml.example",
}
COMPOSE_SOURCES = {
    "intel": "docker/compose/frigate.intel.yml",
    "amd": "docker/compose/frigate.amd.yml",
    "rocm": "docker/compose/frigate.amd.yml",
    "hailo": "docker/compose/frigate.hailo.yml",
    "rockchip": "docker/compose/frigate.rockchip.yml",
    "rk": "docker/compose/frigate.rockchip.yml",
}


def parse_args() -> argparse.Namespace:
    """Parse distribution packaging arguments."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--board", required=True)
    parser.add_argument("--compatibility", required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--image-tag", required=True)
    parser.add_argument("--image-tar", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    return parser.parse_args()


def write_compose_override(path: Path, compatibility: str, tag: str) -> None:
    """Write the board-specific Compose override with the packaged image tag."""
    source_name = COMPOSE_SOURCES.get(compatibility)
    if source_name:
        content = Path(source_name).read_text()
        content = content.replace(
            "${FRIGATE_IMAGE:-frigate:latest}",
            f"${{FRIGATE_IMAGE:-{tag}}}",
        )
        content = content.replace(
            "${FRIGATE_IMAGE:-frigate:latest-rk}",
            f"${{FRIGATE_IMAGE:-{tag}}}",
        )
        content = content.replace(
            f"/config/config.{compatibility}.yml",
            "/config/config.yml",
        )
        content = content.replace("/config/config.rockchip.yml", "/config/config.yml")
    else:
        content = f"""services:\n  frigate:\n    image: ${{FRIGATE_IMAGE:-{tag}}}\n    environment:\n      CONFIG_FILE: ${{FRIGATE_CONFIG_FILE:-/config/config.yml}}\n"""
    path.write_text(content)


def sha256_file(path: Path) -> str:
    """Calculate a SHA-256 digest without loading the image into memory."""
    digest = hashlib.sha256()
    with path.open("rb") as image:
        for chunk in iter(lambda: image.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    """Copy image, configuration, Compose files, and checksums into dist."""
    args = parse_args()
    distribution = args.output_root / args.version / args.board
    distribution.mkdir(parents=True, exist_ok=True)

    image_path = distribution / f"frigate-{args.board}.tar"
    shutil.copyfile(args.image_tar, image_path)
    digest = sha256_file(image_path)
    (distribution / f"{image_path.name}.sha256").write_text(
        f"{digest}  {image_path.name}\n"
    )

    config_source = Path(
        CONFIG_SOURCES.get(args.compatibility, "config/config.yml.example")
    )
    (distribution / "config").mkdir(exist_ok=True)
    shutil.copyfile(config_source, distribution / "config.yml")
    shutil.copyfile(config_source, distribution / "config/config.yml")
    shutil.copyfile("docker-compose.yml", distribution / "docker-compose.yml")
    (distribution / "nanomq").mkdir(exist_ok=True)
    shutil.copyfile("nanomq/nanomq.conf", distribution / "nanomq/nanomq.conf")
    write_compose_override(
        distribution / f"docker-config.{args.compatibility}.yml",
        args.compatibility,
        args.image_tag,
    )

    manifest = {
        "board": args.board,
        "compatibility": args.compatibility,
        "version": args.version,
        "image": args.image_tag,
        "image_tar": image_path.name,
        "sha256": digest,
        "compose": [
            "docker-compose.yml",
            f"docker-config.{args.compatibility}.yml",
        ],
        "config": "config/config.yml",
    }
    (distribution / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    print(f"Created {distribution}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

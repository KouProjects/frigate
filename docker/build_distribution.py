#!/usr/bin/env python3
"""Create a self-contained Frigate distribution directory for a board image."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil


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


def write_compose_file(path: Path, tag: str) -> None:
    """Write a standalone Compose file for the packaged image."""
    path.write_text(
        f"""services:
  frigate:
    container_name: frigate
    image: ${{FRIGATE_IMAGE:-{tag}}}
    restart: unless-stopped
    privileged: true
    shm_size: "64mb"
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - ./config:/config
      - ./media:/media/frigate
    ports:
      - "5000:5000"
      - "8554:8554"
      - "8555:8555/tcp"
      - "8555:8555/udp"
"""
    )


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

    config_source = Path("config/config.yml.example")
    (distribution / "config").mkdir(exist_ok=True)
    shutil.copyfile(config_source, distribution / "config.yml")
    shutil.copyfile(config_source, distribution / "config/config.yml")
    write_compose_file(distribution / "docker-compose.yml", args.image_tag)

    manifest = {
        "board": args.board,
        "compatibility": args.compatibility,
        "version": args.version,
        "image": args.image_tag,
        "image_tar": image_path.name,
        "sha256": digest,
        "compose": ["docker-compose.yml"],
        "config": "config/config.yml",
    }
    (distribution / "manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n"
    )
    print(f"Created {distribution}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/bin/bash

set -euo pipefail

# These folders needs to be created and owned by the host user
mkdir -p debug web/dist

if [[ -f "config/config.yml" ]]; then
  echo "config/config.yml already exists, skipping initialization" >&2
else
  echo "initializing config/config.yml" >&2
  cp -fv config/config.yml.example config/config.yml
fi

if [[ -f "config/config.intel.yml" ]]; then
  echo "config/config.intel.yml already exists, skipping initialization" >&2
else
  echo "initializing config/config.intel.yml" >&2
  cp -fv config/config.intel.yml.example config/config.intel.yml
fi

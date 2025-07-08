#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

npm ci
npm run lint --workspaces

#!/bin/bash

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

cd tests/playwright

npx playwright install --with-deps > /dev/null

npm run test:component

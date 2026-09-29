#!/bin/bash
cd "$(dirname "$(readlink -f "$0")")"
unset ELECTRON_RUN_AS_NODE
exec ./node_modules/electron/dist/electron . --ozone-platform=x11 --no-sandbox >/tmp/dim-overlay.log 2>&1

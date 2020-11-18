#!/usr/bin/env bash

if [ -z "${SKIP_PREPARE}" ]; then
    npx gulp --production
fi

#!/usr/bin/env bash

if [ -z "${SKIP_PREPARE}" ]; then
    webpack --config webpack.prod.js
fi

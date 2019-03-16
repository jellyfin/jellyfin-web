#!/bin/sh

set -e

# used this pull request for reference
# https://github.com/nextcloud/spreed/pull/48
ESLINT=$(which eslint || true)
if [ -z "$ESLINT" ]
then
    echo "could not find eslint in $PATH"
    exit 1
fi

echo checking scripts with $ESLINT
find -name "*.js" -print0 | xargs -0 $ESLINT

# use this line to test changes locally
#find src -name "*.js" -exec sh -c 'npx eslint $1' -- {} \;

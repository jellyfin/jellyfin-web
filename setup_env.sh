#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo Directory of script is: $DIR
export PATH=$PATH:$DIR/node_modules/.bin/
echo New PATH is: $PATH

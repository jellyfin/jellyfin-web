#!/bin/bash
#
# Legacy File Cleanup Script
#
# This script renames legacy JavaScript files to .js.legacy
# to prevent them from being loaded while allowing easy rollback.
#
# IMPORTANT: Run this script AFTER verifying the new TypeScript views work correctly.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTROLLERS_DIR="$SCRIPT_DIR/src/controllers"

echo "========================================="
echo "Jellyfin-Web Legacy File Cleanup"
echo "========================================="
echo ""
echo "This script will rename legacy .js files to .js.legacy"
echo "to prevent them from being loaded."
echo ""
echo "Location: $CONTROLLERS_DIR"
echo ""

# Preview mode - show what would be changed
echo "Files that would be renamed:"
echo "----------------------------"

count=0
while IFS= read -r -d '' file; do
    echo "  $file"
    ((count++))
done < <(find "$CONTROLLERS_DIR" -maxdepth 3 -name "*.js" -type f ! -name "*.test.js" -print0 2>/dev/null)

echo ""
echo "Total files: $count"
echo ""

# Ask for confirmation
read -p "Do you want to proceed with renaming? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. No files were renamed."
    exit 0
fi

echo ""
echo "Renaming files..."
echo "-----------------"

# Do the actual renaming
renamed=0
while IFS= read -r -d '' file; do
    new_name="${file%.js}.js.legacy"
    mv "$file" "$new_name"
    echo "  Renamed: $(basename "$file") → $(basename "$new_name")"
    ((renamed++))
done < <(find "$CONTROLLERS_DIR" -maxdepth 3 -name "*.js" -type f ! -name "*.test.js" -print0 2>/dev/null)

echo ""
echo "Done! Renamed $renamed files."
echo ""
echo "To rollback, run:"
echo "  find $CONTROLLERS_DIR -name '*.js.legacy' -exec sh -c 'mv \"\$1\" \"\${1%.js.legacy}.js\"' _ {} \\;"
echo ""
echo "========================================="

#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <search_string> <replace_string>"
    exit 1
fi

SEARCH="$1"
REPLACE="$2"

FILES=$(grep -RIl "$SEARCH" .)

if [ -z "$FILES" ]; then
    echo "No files found containing '$SEARCH'."
    exit 0
fi

for file in $FILES; do
    echo "Replacing in $file"
    sed -i '' "s/$SEARCH/$REPLACE/g" "$file"
done

echo "Done."

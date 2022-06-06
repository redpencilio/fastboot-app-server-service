#!/bin/bash
if [ -f "/app/index.html" ]
then
    # Replace Ember environment variables in the build of the frontend
    PREFIX="EMBER_"
    ENV_VARIABLES=$(env | grep "${PREFIX}")

    while IFS= read -r line; do
        ENV_VARIABLE=$(echo "$line" | sed -e "s/^$PREFIX//" | cut -f1 -d"=")
        VALUE=$(echo "$line" | sed -e 's/[\/&]/\\&/g' | cut -d"=" -f2-)
        echo "replacing ${ENV_VARIABLE} with ${VALUE}"
        sed -i "s/%7B%7B$ENV_VARIABLE%7D%7D/$VALUE/g" /app/index.html
        sed -i "s/{{$ENV_VARIABLE}}/$VALUE/g" /app/index.html
        sed -i "s/%7B%7B$ENV_VARIABLE%7D%7D/$VALUE/g" /app/package.json
        sed -i "s/{{$ENV_VARIABLE}}/$VALUE/g" /app/package.json
    done <<< "$ENV_VARIABLES"
fi
exec node /usr/src/app/server.js

#!/usr/bin/env sh

node -r ts-node/register ./src/server/index.ts  -c ./example/erra.config.yaml & npx parcel serve ./src/client/index.html --cert ./ca/erra.crt.pem --key ./ca/erra.key.pem
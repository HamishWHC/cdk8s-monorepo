#!/usr/bin/env bash

cd "$(dirname "$0")"

if [[ -f ".env" ]]; then
    source .env
fi

if [[ -z "$CLUSTER_NAME" ]]; then
    echo Missing CLUSTER_NAME environment variable.
fi

if [[ -z "$KUBERNETES_ENDPOINT" ]]; then
    echo Missing KUBERNETES_ENDPOINT environment variable.
fi

mkdir -p out

talosctl gen config --force \
    --with-secrets secrets.yaml \
    --config-patch @common.patch.yaml \
    --config-patch-control-plane @controlplane.patch.yaml \
    --config-patch-worker @worker.patch.yaml \
    --output-types talosconfig,controlplane,worker \
    -o out "$CLUSTER_NAME" "$KUBERNETES_ENDPOINT" $@

#!/bin/bash
# usage: dl.sh name url [name url ...]
cd "$(dirname "$0")"
while [ $# -gt 1 ]; do curl -sS -o "$1.png" "$2" && echo "saved $1"; shift 2; done

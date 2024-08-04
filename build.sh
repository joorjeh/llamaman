#!/bin/bash

if ! bash ./load_tools.sh; then
  echo "Error: Failed to load tools. Exiting."
  exit 1
fi
yarn tauri build

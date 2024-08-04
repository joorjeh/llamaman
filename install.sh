#!/bin/bash

if ! bash ./load_tools.sh; then
  echo "Error: Failed to load tools. Exiting."
  exit 1
fi

if ! yarn tauri build; then
  echo "yarn tauri build failed. Exiting"
  exit 1
fi

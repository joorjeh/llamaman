#!/bin/bash

if ! bash ./load_tools.sh; then
  echo "Error: Failed to load tools. Exiting."
  exit 1
fi

yarn
yarn tauri build

if [ ! -d "bin" ]; then
  mkdir bin
fi

if [ ! -f bin/vogelsang ]; then
  touch bin/vogelsang
  chmod +x bin/vogelsang
fi

cat <<'EOF' >bin/vogelsang
#!/bin/bash

cd $HOME/.local/vogelsang/
if ! bash ./load_tools.sh; then
  echo "Error: Failed to load tools. Exiting."
  exit 1
fi

yarn 
yarn tauri build

./src-tauri/target/release/bundle/appimage/vogelsang_*.AppImage

EOF

echo '' >>$HOME/.bashrc
echo '# Add Vogelsang binary directory to PATH' >>$HOME/.bashrc
echo 'export PATH=$PATH:$HOME/.local/vogelsang/bin' >>$HOME/.bashrc

# Reload .bashrc
source $HOME/.bashrc

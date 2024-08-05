#!/bin/bash

# TODO add help command or vogelsang

cd $HOME/.local/vogelsang/

bash ./load_tools.sh
hash=$(md5sum "$HOME/.vogelsang/tools.json" | awk '{print $1}')
echo "$hash" >"$HOME/.local/vogelsang/.tools_hash"
yarn
yarn tauri build --bundles deb
dpkg-deb -R ./src-tauri/target/release/bundle/deb/vogelsang*amd64.deb .

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

if [ "$1" = "uninstall" ]; then
  echo "Uninstalling..."
  [ -d "$HOME/.local/vogelsang" ] && rm -rf "$HOME/.local/vogelsang"
  [ -d "$HOME/.vogelsang" ] && rm -rf "$HOME/.vogelsang"
  [ -f "$HOME/.local/share/applications/vogelsang.desktop" ] && rm -f "$HOME/.local/share/applications/vogelsang.desktop"
  echo "Successfully removed vogelsang."
  exit 1
fi

if [ "$1" = "update" ]; then
  echo "Updating..."
  git pull
  yarn
  yarn tauri build --bundles deb
  rm -rf DEBIAN/
  rm -rf usr/
  dpkg-deb -R ./src-tauri/target/release/bundle/deb/vogelsang*amd64.deb .
fi

new_hash=$(md5sum "$HOME/.vogelsang/tools.json" | awk '{print $1}')
if [ -f .tools_hash ]; then
    stored_hash=$(cat .tools_hash)
    if [ "$new_hash" != "$stored_hash" ]; then
        echo "Hash does not match"
        if ! bash ./load_tools.sh; then
          echo "Error: Failed to load tools. Exiting."
          exit 1
        fi
        yarn
        yarn tauri build --bundles app
        echo "$new_hash" > .tools_hash
    fi
else
    echo "File .tools_hash does not exist"
    echo "$new_hash" > .tools_hash
    yarn
    yarn tauri build --bundles deb
fi

rm -rf DEBIAN/
rm -rf usr/
dpkg-deb -R ./src-tauri/target/release/bundle/deb/vogelsang*amd64.deb .
./usr/bin/vogelsang

EOF

echo '' >>$HOME/.bashrc
echo '# Add Vogelsang binary directory to PATH' >>$HOME/.bashrc
echo 'export PATH=$PATH:$HOME/.local/vogelsang/bin' >>$HOME/.bashrc

# Reload .bashrc
source $HOME/.bashrc

# # Create desktop file
# cat <<EOF >$HOME/.local/share/applications/vogelsang.desktop
# [Desktop Entry]
# Name=Vogelsang
# Exec=$HOME/.local/vogelsang/bin/vogelsang
# Icon=$HOME/.local/vogelsang/src-tauri/icons/128x128.png
# Type=Application
# Categories=Utility;
# EOF

# # Make the desktop file executable
# chmod +x $HOME/.local/share/applications/vogelsang.desktop

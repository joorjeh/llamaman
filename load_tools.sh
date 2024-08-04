#!/bin/bash

# Check if jq is installed
if ! command -v jq &>/dev/null; then
  echo "Error: jq is not installed. Please install jq to run this script."
  exit 1
fi

input_file="$HOME/.vogelsang/tools.json"
output_file="$HOME/vogelsang/src/tools.ts"

tool_name=$(jq -r 'keys[0]' "$input_file")

cat <<EOF >"$output_file"
import Tool from './types/Tool';
import { invoke } from '@tauri-apps/api/tauri';

const tools: Record<string, Tool> = {
  $tool_name: {
    toolDefinition: \`$(jq -c . "$input_file" | sed 's/"/\\"/g')\`,
    description: $(jq -r ".$tool_name.description" "$input_file" | sed 's/^/'"'"'/; s/$/'"'"'/'),
    args: {
EOF

jq -r ".$tool_name.parameters | to_entries[] | \"\t\t\(.key): \\\"\(.value.param_type)\\\",\"" "$input_file" >>"$output_file"

cat <<EOF >>"$output_file"
    },
    f: async ({ $(jq -r ".$tool_name.parameters | keys | join(\", \")" "$input_file") }: { $(jq -r ".$tool_name.parameters | to_entries[] | \"\(.key): \(.value.param_type)\"" "$input_file" | paste -sd ", " -) }): Promise<string> => {
      const response: string = await invoke('${tool_name}', { $(jq -r ".$tool_name.parameters | keys | join(\", \")" "$input_file") });
      return response;
    }
  },
};

export default tools;
EOF

source_file="$HOME/.vogelsang/tools.rs"
destination_file="$HOME/vogelsang/src-tauri/src/main.rs"

# Check if source file exists
if [ ! -f "$source_file" ]; then
  echo "Error: Source file '$source_file' does not exist."
  exit 1
fi

# Find the line number with '// TODO' in the destination file
todo_line=$(grep -n "// TOOLS" "$destination_file" | cut -d: -f1)

if [ -z "$todo_line" ]; then
  echo "Error: '// TOOLS' not found in destination file."
  exit 1
fi

# Delete all lines below '// TODO' and append the source file
sed -i "${todo_line}q" "$destination_file"
cat "$source_file" >>"$destination_file"

echo "Contents of '$source_file' have been appended to '$destination_file' after '// TODO'"

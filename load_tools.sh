#!/bin/bash

if ! command -v jq &>/dev/null; then
  echo "Error: jq is not installed. Please install jq to run this script."
  exit 1
fi

input_file="$HOME/.vogelsang/tools.json"
output_file="$HOME/vogelsang/src/tools.ts"

#!/bin/bash

cat <<EOF >"$output_file"
import Tool from './types/Tool';
import { invoke } from '@tauri-apps/api/tauri';

const tools: Record<string, Tool> = {
EOF

jq -r 'keys[]' "$input_file" | while read -r tool_name; do
  cat <<EOF >>"$output_file"
  $tool_name: {
    toolDefinition: \`$(jq -c ".$tool_name" "$input_file" | sed 's/"/\\"/g')\`,
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
EOF
done

cat <<EOF >>"$output_file"
};

export default tools;
EOF

# RUST_TOOLS_FILE="$HOME/.vogelsang/tools.rs"
# DESTINATION_FILE="$HOME/vogelsang/src-tauri/src/main.rs"

# # Check if source file exists
# if [ ! -f "$RUST_TOOLS_FILE" ]; then
#   echo "Error: Source file '$source_file' does not exist."
#   exit 1
# fi

# # Process the input file and extract function names
# function_names=$(grep -oP '(?<=fn )\w+(?=\()' "$RUST_TOOLS_FILE" | tr '\n' ' ')

# # Read the output file, remove content after "// TOOLS", and store in a temporary file
# sed '/\/\/ TOOLS/q' "$output_file" >temp_output.rs

# # Append the updated generate_handler macro
# echo "         .invoke_handler(tauri::generate_handler![" >>temp_output.rs
# echo "           get_user_config," >>temp_output.rs
# echo "           update_user_config," >>temp_output.rs
# for func in $function_names; do
#   echo "           $func," >>temp_output.rs
# done
# echo "         ])" >>temp_output.rs

# # Append the rest of the content from the input file
# sed -n '/#\[command\]/,$p' "$RUST_TOOLS_FILE" >>temp_output.rs

# echo "Tools loaded successfully"

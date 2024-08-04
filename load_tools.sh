#!/bin/bash

if ! command -v jq &>/dev/null; then
  echo "Error: jq is not installed. Please install jq to run this script."
  exit 1
fi

input_file="$HOME/.vogelsang/tools.json"
output_file="$HOME/.local/vogelsang/src/tools.ts"

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

# Load Rust fns and add names to generate_handler macro

input_file="$HOME/.vogelsang/tools.rs"
output_file="$HOME/.local/vogelsang/src-tauri/src/main.rs"

temp_file=$(mktemp)

# Copy content up to and including the line with '// TOOLS' to the temp file
sed '/\/\/ TOOLS/q' "$output_file" >"$temp_file"

# Append the entire source file to the temp file
cat "$input_file" >>"$temp_file"

# Replace the destination file with the temp file
mv "$temp_file" "$output_file"

# Extract function names from the input file
function_names=$(grep -oP '(?<=fn )\w+(?=\()' "$input_file")

# Create a temporary file
temp_file=$(mktemp)

# Process the output file and update the generate_handler macro
awk -v functions="$function_names" '
BEGIN {
    split(functions, func_array, "\n")
    in_macro = 0
    printed_update_user_config = 0
}
/\.invoke_handler\(tauri::generate_handler!\[/ {
    print $0
    in_macro = 1
    print "            get_user_config,"
    print "            update_user_config,"
    for (i in func_array) {
        print "            " func_array[i] ","
    }
    next
}
/\]\)/ {
    if (in_macro) {
        print $0
        in_macro = 0
        next
    }
}
!/get_user_config,/ && !/update_user_config,/ && !in_macro {
    print $0
}
' "$output_file" >"$temp_file"

# Replace the original output file with the updated content
mv "$temp_file" "$output_file"

echo "Handler macro updated successfully in $output_file"

#!/bin/bash

if ! command -v jq &>/dev/null; then
  echo "Error: jq is not installed. Please install jq to run this script."
  exit 1
fi

input_file="$HOME/.llamaman/tools.json"
output_file="$HOME/.local/llamaman/src/tools.ts"

cat <<EOF >"$output_file"
import Tool from './types/Tool';
import { invoke } from '@tauri-apps/api/tauri';

const tools: Record<string, Tool> = {
EOF

jq -r 'keys[]' "$input_file" | while read -r tool_name; do
  cat <<EOF >>"$output_file"
  $tool_name: {
    toolDefinition: \`$(jq -c ".$tool_name + {\"name\": \"$tool_name\"}" "$input_file" | sed 's/"/\\"/g')\`,
    description: $(jq -r ".$tool_name.description" "$input_file" | sed 's/^/'"'"'/; s/$/'"'"'/'),
    args: {
EOF

  jq -r ".$tool_name.parameters | to_entries[] | \"\t\t\(.key): \\\"\(.value.param_type)\\\",\"" "$input_file" >>"$output_file"

  cat <<EOF >>"$output_file"
    },
    f: async ({ $(jq -r ".$tool_name.parameters | keys | join(\", \")" "$input_file") }: { $(jq -r ".$tool_name.parameters | to_entries[] | \"\(.key): \(.value.param_type)\"" "$input_file" | paste -sd ", " -) }): Promise<string> => {
      try {
        const response: string = await invoke('${tool_name}', { $(jq -r ".$tool_name.parameters | keys | join(\", \")" "$input_file") });
        return response;
      } catch (error) {
        return String(error);
      }
    }
  },
EOF
done

cat <<EOF >>"$output_file"
};

export default tools;
EOF

# Load Rust fns and add names to generate_handler macro

input_file="$HOME/.llamaman/tools.rs"
output_file="$HOME/.local/llamaman/src-tauri/src/main.rs"

temp_file=$(mktemp)

# Copy content up to and including the line with '// TOOLS' to the temp file
sed '/\/\/ TOOLS/q' "$output_file" >"$temp_file"

# Append the entire source file to the temp file
cat "$input_file" >>"$temp_file"

# Replace the destination file with the temp file
mv "$temp_file" "$output_file"

# Extract function names from the input file
function_names=$(grep -oP '(?<=fn )\w+(?=\()' "$input_file")

# Extract imports from the input file
imports=$(grep -P '^use' "$input_file")

# Create a temporary file
temp_file=$(mktemp)

# Process the output file, update imports and the generate_handler macro
awk -v imports="$imports" -v functions="$function_names" '
BEGIN {
    split(functions, func_array, "\n")
    in_macro = 0
    printed_imports = 0
}
/\/\/ Tool imports/ {
    print $0
    print imports
    printed_imports = 1
    next
}
/\.invoke_handler\(tauri::generate_handler!\[/ {
    print $0
    in_macro = 1
    print "            get_aws_credentials,"
    print "            get_user_config,"
    print "            update_user_config,"
    print "            read_file,"
    print "            write_file,"
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
!/^use/ || !printed_imports {
    if (!/get_aws_credentials,/ && !/get_user_config,/ && !/update_user_config,/ && !in_macro) {
        print $0
    }
}
' "$output_file" >"$temp_file"

# Replace the original output file with the updated content
mv "$temp_file" "$output_file"

echo "Tools loaded successfully."

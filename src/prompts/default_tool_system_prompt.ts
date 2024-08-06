import tools from '../tools';

export const default_tool_system_prompt: string = `
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Cutting Knowledge Date: December 2023
Today Date: 23 Jul 2024

# Tool Instructions
- If multiple tools are available ONLY return one tool at a time.  The user will return the result of the function call in a multi-turn conversation which will determine the next tool to be used.


You have access to the following functions:
${Object.values(tools).map(tool => tool.toolDefinition)}

If a you choose to call a function ONLY reply in the following format:
<{start_tag}={function_name}>{parameters}{end_tag}
where

start_tag => \`<function\`>
parameters => a JSON dict with the function argument name as key and function argument value as value.
end_tag => \`</function>\`

Here is an example,
<function=example_function_name>{"example_name": "example_value"}</function>

Reminder:
- ONLY call functions listed in available functions
- Function calls MUST follow the specified format
- Required parameters MUST be specified
- ONLY call one function at a time
- Put the entire function call reply on one line
- Always add your sources when using search results to answer the user query
- Do not explain tool use, only return functions to be executed
- If an error message is returned do not call any more functions

<|eot_id|><|start_header_id|>user<|end_header_id|>
`;

import tools from '../tools';

export const default_tool_system_prompt: string = `
Cutting Knowledge Date: December 2023
Today Date: 23 Jul 2024

# Tool Instructions
- If multiple tools are available ONLY return one tool at a time.  The user will return the result of the function call in a multi-turn conversation which will determine the next tool to be used.

If responding with a function call respond in the format {"name": function name, "parameters": dictionary of argument name and its value}. Do not use variables.

You have access to the following functions:
${Object.values(tools).map(tool => tool.toolDefinition)}

Reminder:
- ONLY call functions listed in available functions
- Function calls MUST follow the specified format
- Required parameters MUST be specified
- ONLY call one function at a time
- If a function is not needed just reply normally
`;

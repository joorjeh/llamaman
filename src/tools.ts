import { fs } from '@tauri-apps/api';
import Tool from './types/Tool';
import { invoke } from '@tauri-apps/api/tauri';

const tools: Record<string, Tool> = {
  readFile: {
    toolDefinition: `{
  "name": "readFile",
  "description": "Read file from local system.",
  "parameters": {
    "filename": {
      "param_type": "string",
      "description": "The filename of file",
      "required": true
    }
  }
}`,
    description: 'Reads file content',
    args: {
      filename: "string",
    },
    f: async ({ filename }: { filename: string }): Promise<string> => {
      //const content: string = await invoke('read_file', { filename: filename });
      //return content;
      const content = await fs.readTextFile('/home/anon/.vogelsang/' + filename);
      return content;
    }
  },
  writeFile: {
    toolDefinition: `{
  "name": "writeFile",
  "description": "Write content to a file in the local system.",
  "parameters": {
    "filename": {
      "param_type": "string",
      "description": "The filename of the file to write",
      "required": true
    },
    "content": {
      "param_type": "string",
      "description": "The content to write to the file",
      "required": true
    }
  }
}`,
    description: 'Writes content to a file',
    args: {
      filename: "string",
      content: "string",
    },
    f: async ({ filename, content }: { filename: string, content: string }): Promise<string> => {
      const response: string = await invoke('write_file', { filename, content });
      return response;
    }
  },
  add: {
    toolDefinition: `{
      "name": "multiply",
      "description": "Multiply two numbers",
      "parameters": {
        "a": {
          "param_type": "int",
          "description": "An integer",
          "required": true
        },
        "b": {
          "param_type": "int",
          "description": "An integer",
          "required": true
        }
      }
    }`,
    description: 'Adds two numbers',
    args: {
      a: "number",
      b: "number",
    },
    f: ({ a, b }: { a: number; b: number }): number => {
      return a + b;
    }
  },
  multiply: {
    toolDefinition: `{
  "name": "add",
  "description": "Add two numbers",
  "parameters": {
    "a": {
      "param_type": "int",
      "description": "An integer",
      "required": true
    },
    "b": {
      "param_type": "int",
      "description": "An integer",
      "required": true
    }
  }
}`,
    description: 'Multiplies two numbers',
    args: {
      a: "number",
      b: "number",
    },
    f: ({ a, b }: { a: number; b: number }): number => {
      return a * b;
    }
  },
};

export default tools;

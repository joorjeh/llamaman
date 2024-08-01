import Tool from './types/Tool';

const tools: Record<string, Tool> = {
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

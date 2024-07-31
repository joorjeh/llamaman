import Tool from './types/Tool';

const tools: Record<string, Tool> = {
  add: {
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
    description: 'Multiplies two numbers',
    args: {
      a: "number",
      b: "number",
    },
    f: ({ a, b }: { a: number; b: number }): number => {
      return a * b;
    }
  }
};

export default tools;

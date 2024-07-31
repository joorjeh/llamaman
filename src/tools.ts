type Tool = {
  description: string;
  f: (...args: any[]) => number | string;
};

const tools: Record<string, Tool> = {
  add: {
    description: 'Adds two numbers',
    f: ({ a, b }: { a: number, b: number }): number => {
      return a + b
    }
  },
  multiply: {
    description: 'Multiplies two numbers',
    f: ({ a, b }: { a: number, b: number }): number => {
      return a * b;
    }
  }
}

export default tools;

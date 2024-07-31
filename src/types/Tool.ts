interface Tool {
  description: string;
  args: Record<string, string>;
  f: (args: any) => number | string;
};

export default Tool;

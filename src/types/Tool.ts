interface Tool {
  toolDefinition: string;
  description: string;
  args: Record<string, string>;
  f: (args: any) => any;
};

export default Tool;

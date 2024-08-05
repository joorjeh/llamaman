interface Tool {
  name: string;
  toolDefinition: string;
  description: string;
  args: Record<string, string>;
  f: (args: any) => any;
};

export default Tool;

import default_tools from "./default_tools";
import user_tools from "./user_tools";
import Tool from "../types/Tool";

const tools: Record<string, Tool> = {
  ...default_tools,
  ...user_tools,
};

export default tools;

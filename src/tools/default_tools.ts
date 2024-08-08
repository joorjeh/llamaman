import Tool from '../types/Tool';
import { invoke } from '@tauri-apps/api/tauri';

const default_tools: Record<string, Tool> = {
  read_file: {
    toolDefinition: `{\"description\":\"Read the contents of a file.\",\"parameters\":{\"filename\":{\"param_type\":\"string\",\"description\":\"The name of the file to read\",\"required\":true}},\"name\":\"read_file\"}`,
    description: 'Read the contents of a file.',
    args: {
      filename: "string",
    },
    f: async ({ filename }: { filename: string }): Promise<string> => {
      try {
        const response: string = await invoke('read_file', { filename });
        return response;
      } catch (error) {
        return String(error);
      }
    }
  },
  write_file: {
    toolDefinition: `{\"description\":\"Write content to a file.\",\"parameters\":{\"filename\":{\"param_type\":\"string\",\"description\":\"The name of the file to write\",\"required\":true},\"content\":{\"param_type\":\"string\",\"description\":\"The content to write to the file\",\"required\":true}},\"name\":\"write_file\"}`,
    description: 'Write content to a file.',
    args: {
      filename: "string",
      content: "string",
    },
    f: async ({ content, filename }: { filename: string, content: string }): Promise<string> => {
      try {
        const response: string = await invoke('write_file', { content, filename });
        return response;
      } catch (error) {
        return String(error);
      }
    }
  },
};


export default default_tools;

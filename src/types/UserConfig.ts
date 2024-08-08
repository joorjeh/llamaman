interface UserConfig {
  platform: string;
  url: string;
  model: string;
  temperature: number;
  max_steps: number;
  top_p: number;
  workspace_dir: string;
}

export default UserConfig;

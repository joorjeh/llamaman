import { Box, Button, MenuItem, Select, TextField } from "@mui/material";
import { updateUserConfig } from "./utils";
import UserConfig from "./types/UserConfig";

interface ConfigurationProps {
  config: UserConfig | null;
  setConfig: React.Dispatch<React.SetStateAction<UserConfig | null>>;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const Configuration = ({
  config,
  setConfig,
  setOpenModal,
}: ConfigurationProps) => {

  const handleConfigUpdate = (e: any) => {
    e.preventDefault();
    updateUserConfig(config!).then(() => {
      setConfig(config);
      setOpenModal(false);
    });
  };

  return (
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '50vw',
      transform: 'translate(-50%, -50%)',
      bgcolor: 'background.paper',
      borderRadius: '10px',
      boxShadow: 24,
      p: 4,
    }}>
      <Box sx={{
        display: 'grid',
        gap: '20px',
        justifyContent: 'center',
        alignItems: 'center',
        gridTemplateAreas: `
      "platform platformSelect"
      "url urlInput"
      "save save"
                `,
        gridTemplateColumns: 'auto 1fr',
      }}>
        <Box sx={{ gridArea: 'platform' }}>Platform</Box>
        <Box sx={{ gridArea: 'platformSelect' }}>
          <Select
            value={config!.platform}
            onChange={(e: any) => {
              const newConfig = {
                ...config!,
                platform: e.target.value,
              };
              setConfig(newConfig);
            }
            }
          >
            <MenuItem value="aws">AWS</MenuItem>
            <MenuItem value="ollama">Ollama</MenuItem>
          </Select>
        </Box>
        <Box sx={{ gridArea: 'url' }}>URL</Box>
        <TextField
          sx={{ gridArea: 'urlInput' }}
          name="url"
          variant="outlined"
          value={config!.url}
          onChange={(e: any) => {
            const newConfig = {
              ...config!,
              url: e.target.value,
            };
            setConfig(newConfig);
          }
          }
        />
        <Button
          sx={{
            gridArea: 'save',
            justifySelf: 'center',
          }}
          onClick={handleConfigUpdate}
          variant="contained"
        >
          Save
        </Button>
      </Box>
    </Box >
  )
}

export default Configuration;

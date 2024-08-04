import { Box, Button, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { updateUserConfig } from "./utils";
import UserConfig from "./types/UserConfig";
import { ChangeEvent, useState } from "react";
import { modelIds } from "./platforms";

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
  const [newConfig, setNewConfig] = useState<UserConfig>(config!);

  const handleConfigUpdate = (e: any) => {
    e.preventDefault();
    updateUserConfig(newConfig).then(() => {
      setConfig(newConfig);
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
      "model modelInput"
      "save save"`,
        gridTemplateColumns: 'auto 1fr',
      }}>
        <Box sx={{ gridArea: 'platform' }}>Platform</Box>
        <Box sx={{ gridArea: 'platformSelect' }}>
          <Select
            value={newConfig.platform}
            onChange={(e: SelectChangeEvent) => {
              setNewConfig(prevConfig => {
                return {
                  ...prevConfig,
                  platform: e.target.value as string,
                  model: modelIds[e.target.value as string][0],
                }
              })
            }}
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
          value={newConfig.url}
          disabled={newConfig.platform === 'aws'}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setNewConfig(prevConfig => {
              return {
                ...prevConfig,
                url: e.target.value as string,
              }
            })
          }}
        />
        <Box sx={{ gridArea: 'model' }}>Model ID</Box>
        <Select
          sx={{ gridArea: 'modelInput' }}
          name="model"
          variant="outlined"
          value={newConfig.model}
          onChange={(e: SelectChangeEvent) => {
            setNewConfig(prevConfig => {
              return {
                ...prevConfig,
                model: e.target.value as string,
              }
            })
          }}
        >
          {modelIds[newConfig.platform].map((modelId) => (
            <MenuItem key={modelId} value={modelId}>
              {modelId}
            </MenuItem>
          ))}
        </Select>
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

import { Box, Button, MenuItem, Select, SelectChangeEvent, TextField } from "@mui/material";
import { getAwsCredentials, updateUserConfig } from "./utils";
import UserConfig from "./types/UserConfig";
import { ChangeEvent, useState } from "react";
import { getAwsClient, modelIds } from "./platforms";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

interface ConfigurationProps {
  config: UserConfig | null;
  setConfig: React.Dispatch<React.SetStateAction<UserConfig | null>>;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  setClient: React.Dispatch<React.SetStateAction<BedrockRuntimeClient | null>>;
}

const Configuration = ({
  config,
  setConfig,
  setOpenModal,
  setClient,
}: ConfigurationProps) => {
  const [newConfig, setNewConfig] = useState<UserConfig>(config!);

  const handleConfigUpdate = async (e: any) => {
    e.preventDefault();
    if (newConfig.platform === 'aws') {
      const credentials = await getAwsCredentials();
      setClient(getAwsClient(credentials));
    }
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
      width: '75vw',
      transform: 'translate(-50%, -50%)',
      bgcolor: 'background.paper',
      borderRadius: '10px',
      boxShadow: 24,
      p: 4,
    }}>
      <Box sx={{
        display: 'grid',
        gap: '20px',
        maxWidth: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gridTemplateAreas: `
      "platform platformSelect"
      "url urlInput"
      "model modelInput"
      "maxSteps maxStepsInput"
      "temperature temperatureInput"
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
              });
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
        <Box sx={{ gridArea: 'maxSteps' }}>Max Steps</Box>
        <TextField
          sx={{ gridArea: 'maxStepsInput' }}
          name="maxSteps"
          type="number"
          variant="outlined"
          value={newConfig.max_steps}
          inputProps={{ min: 1 }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            let new_max_steps = Math.max(0, parseInt(e.target.value));
            setNewConfig(prevConfig => ({
              ...prevConfig,
              max_steps: new_max_steps,
            }));
          }}
        />
        <Box sx={{ gridArea: 'temperature' }}>Temperature</Box>
        <TextField
          sx={{ gridArea: 'temperatureInput' }}
          name="temperature"
          variant="outlined"
          value={newConfig.temperature}
          type="number"
          inputProps={{ min: "0", step: "0.1" }}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            let new_temperature = Math.max(0, parseFloat(value));
            if (!isNaN(new_temperature)) {
              setNewConfig(prevConfig => ({
                ...prevConfig,
                temperature: Number(new_temperature.toFixed(2)),
              }));
            }
          }}
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

import { Box, Button, CircularProgress, MenuItem, Select, TextField } from "@mui/material";
import { getUserConfig } from "./utils";
import UserConfig from "./types/UserConfig";
import { useEffect, useState } from "react";
import { modelIds } from "./platforms";
import StreamingClient from "./clients/Client";
import { getStreamingClient } from "./clients/factory";

interface ConfigurationProps {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  setMaxSteps: React.Dispatch<React.SetStateAction<number>>;
  setClient: React.Dispatch<React.SetStateAction<StreamingClient | null>>;
  setSnackBar: (message: string) => void;
}

const Configuration = ({
  setOpenModal,
  setClient,
  setSnackBar,
  setMaxSteps,
}: ConfigurationProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [newConfig, setNewConfig] = useState<UserConfig | null>(null);

  useEffect(() => {
    getUserConfig().then((config) => {
      setNewConfig(config);
      setLoading(false);
    });
  }, []);

  const handleConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConfig) return;

    const client = await getStreamingClient({
      platform: newConfig.platform,
      options: {
        region: 'us-west-2',
        model: newConfig.model,
        temperature: newConfig.temperature,
        top_p: newConfig.top_p,
      }
    });
    setClient(client);
    setMaxSteps(newConfig.max_steps);
    setOpenModal(false);
    setSnackBar('Configuration updated');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!newConfig) {
    return null;
  }

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
            onChange={(e) => {
              setNewConfig(prevConfig => prevConfig ? ({
                ...prevConfig,
                platform: e.target.value as string,
                model: modelIds[e.target.value as keyof typeof modelIds][0],
              }) : null);
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
          onChange={(e) => {
            setNewConfig(prevConfig => prevConfig ? ({
              ...prevConfig,
              url: e.target.value,
            }) : null);
          }}
        />
        <Box sx={{ gridArea: 'model' }}>Model ID</Box>
        <Select
          sx={{ gridArea: 'modelInput' }}
          name="model"
          variant="outlined"
          value={newConfig.model}
          onChange={(e) => {
            setNewConfig(prevConfig => prevConfig ? ({
              ...prevConfig,
              model: e.target.value as string,
            }) : null);
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
          onChange={(e) => {
            const new_max_steps = Math.max(1, parseInt(e.target.value));
            setNewConfig(prevConfig => prevConfig ? ({
              ...prevConfig,
              max_steps: new_max_steps,
            }) : null);
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
          onChange={(e) => {
            const new_temperature = Math.max(0, parseFloat(e.target.value));
            if (!isNaN(new_temperature)) {
              setNewConfig(prevConfig => prevConfig ? ({
                ...prevConfig,
                temperature: Number(new_temperature.toFixed(2)),
              }) : null);
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
    </Box>
  );
};

export default Configuration;


import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Modal, Typography, Select, FormControl, MenuItem } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { default_tool_system_prompt } from './prompts/default_tool_system_prompt';
import { getAWSStreamingResponse, getOllamaStreamingResponse } from './platforms';
import { invoke } from '@tauri-apps/api/tauri';

interface Message {
  text: string;
  sender: string;
}

interface UserConfig {
  platform: string;
  url: string;
}

// Get the user config
async function getUserConfig(): Promise<UserConfig> {
  return await invoke('get_user_config');
}

// Update the user config
async function updateUserConfig(newConfig: UserConfig): Promise<void> {
  await invoke('update_user_config', { newConfig });
}

function App() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const messagesEndRef = useRef<any>(null); // TODO determine correct type
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(default_tool_system_prompt);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConfigUpdate = async (e: any) => {
    const newConfig = {
      platform: platform!,
      url: url!,
    }
    await updateUserConfig(newConfig);
  };

  // Load config on app load
  useEffect(() => {
    getUserConfig().then((config) => {
      setPlatform(config.platform);
      setUrl(config.url);
    });
  }, []);

  useEffect(() => {
    if (platform) {
      setLoading(false);
    }
  }, [platform, url]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = (e: any) => {
    e.preventDefault();
    setMessages([]);
    setPrompt(default_tool_system_prompt);
  }

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      let updatedPrompt = prompt;
      updatedPrompt += inputMessage;
      updatedPrompt += "<|eot_id|><|start_header_id|>assistant<|end_header_id|>";
      setPrompt(updatedPrompt); // in case the response throws error
      setMessages(prevMessages => [...prevMessages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');

      try {
        setMessages(prevMessages => [...prevMessages, { text: '', sender: 'ai' }]);

        if (platform) {
          let aiResponse: string = "";
          for await (const chunk of platform === 'aws' ? getAWSStreamingResponse({
            prompt: updatedPrompt,
          }) : getOllamaStreamingResponse({
            prompt: updatedPrompt,
          })) {
            aiResponse += chunk;
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              newMessages[newMessages.length - 1].text = aiResponse;
              return newMessages;
            });
          }

          updatedPrompt += aiResponse;
          updatedPrompt += "<|eot_id|><|start_header_id|>user<|end_header_id|>";
          setPrompt(updatedPrompt);
        }
      } catch (error: any) {
        console.error("Error: ", error.toString())
      }
    }
  }

  return (
    <> {isLoading ? <CircularProgress size={100} /> :
      <Box sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: '100%',
          height: '100%',
          justifyContent: 'flex-end',
          padding: '10px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
            {
              messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'ai' ? 'flex-end' : 'flex-start',
                    marginTop: index === 0 ? 'auto' : 'initial'
                  }}
                >
                  <Box sx={{ maxWidth: '70%', whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Box>
                </Box>
              ))
            }
            <div ref={messagesEndRef} />
          </Box>
          <Box
            component="form"
            onSubmit={handleSendMessage}
            sx={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
              sx={{ height: '100%' }}
            />
            <Button type="submit" variant="contained" sx={{ height: '56px' }}>Send</Button>
            <Button variant="contained" onClick={clearChat} sx={{ height: '56px' }}>Clear</Button>
            <Button>
              <SettingsIcon
                sx={{
                  height: '40px',
                  width: '40px'
                }}
                onClick={() => setOpenModal(true)}
              />
            </Button>
          </Box>
        </Box>
      </Box >
    }
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography
              id="modal-modal-title"
              variant="h6"
              component="h2"
            >
              Config
            </Typography>
            <FormControl>
              <Select
                value={platform}
                label="Platform"
                onChange={(e) => setPlatform(e.target.value)}
              >
                <MenuItem value="aws">AWS</MenuItem>
                <MenuItem value="ollama">Ollama</MenuItem>
              </Select>
              <TextField
                label="URL"
                name="url"
                variant="outlined"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={handleConfigUpdate}>
                Save
              </Button>
            </FormControl>
          </Box>
        </Box>
      </Modal>
    </>
  );
}

export default App;


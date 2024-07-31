import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Modal, Select, MenuItem } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { default_tool_system_prompt } from './prompts/default_tool_system_prompt';
import { getAWSStreamingResponse, getOllamaStreamingResponse } from './platforms';
import { invoke } from '@tauri-apps/api/tauri';
import MessageBox from './MessageBox';
import Message from './types/Message';
import { searchFunctionTags } from './utils';
import tools from './tools';

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
  const [configSaving, setConfigSaving] = useState<boolean>(false);
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

  const handleConfigUpdate = (e: any) => {
    e.preventDefault();
    setConfigSaving(true);
    const newConfig = {
      platform: platform!,
      url: url!,
    }
    updateUserConfig(newConfig).then(() => {
      setOpenModal(false);
      setConfigSaving(false);
    });
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
          // TODO streamingFunctions shoudl be handled differently, not a match statement
          let aiResponse: string = "";
          for await (const chunk of platform === 'aws' ? getAWSStreamingResponse({
            prompt: updatedPrompt,
          }) : getOllamaStreamingResponse({
            prompt: updatedPrompt,
          })) {
            aiResponse += chunk;
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              newMessages[newMessages.length - 1].text = aiResponse.trimStart();
              return newMessages;
            });
          }

          const funcDescription = searchFunctionTags(aiResponse);
          if (funcDescription) {
            const f = tools[funcDescription.name].f;
            console.log("Type of arguments:", ...Array.from(f.arguments).map(arg => typeof arg));
            console.log("Type of return value:", typeof (f()));
            console.log("result of f: ", f(funcDescription.args));
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
                <MessageBox key={index} message={message} index={index} />
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
        {configSaving ? <CircularProgress /> :
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
              gap: '10px',
              justifyContent: 'center',
              alignItems: 'center',
              gridTemplateAreas: `
      "config config"
      "platform platformSelect"
      "url urlInput"
      ". save"
    `,
              gridTemplateColumns: 'auto 1fr',
            }}>
              <Box sx={{ gridArea: 'config' }}>Configuration</Box>
              <Box sx={{ gridArea: 'platform' }}>Platform</Box>
              <Box sx={{ gridArea: 'platformSelect' }}>
                <Select
                  value={platform}
                  onChange={(e) => {
                    setPlatform(e.target.value);
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
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                }}
              />
              <Button sx={{ gridArea: 'save', justifySelf: 'end' }} onClick={handleConfigUpdate} variant="contained">Save</Button>
            </Box>
          </Box>
        }
      </Modal >
    </>
  );
}

export default App;


import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
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
  url: String;
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
  const messagesEndRef = useRef<any>(null); // TODO determine correct type
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [prompt, setPrompt] = useState<string>(default_tool_system_prompt);
  const [config, setConfig] = useState<UserConfig | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePlatformChange = async (newPlatform: string) => {
    if (config) {
      const newConfig = { ...config, platform: newPlatform };
      await updateUserConfig(newConfig);
      setConfig(newConfig);
    }
  };

  // Load config on app load
  useEffect(() => {
    getUserConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (config) {
      setLoading(false);
    }
  }, [config]);

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

        if (config) {
          let aiResponse: string = "";
          for await (const chunk of config.platform === 'aws' ? getAWSStreamingResponse({
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
            <SettingsIcon sx={{ height: '40px', width: '40px' }} />
          </Box>
        </Box>
      </Box >
    }</>
  );
}

export default App;


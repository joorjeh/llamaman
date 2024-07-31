import { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, CircularProgress, Modal, Select, MenuItem } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { default_tool_system_prompt } from './prompts/default_tool_system_prompt';
import { getAWSStreamingResponse, getOllamaStreamingResponse } from './platforms';
import { invoke } from '@tauri-apps/api/tauri';
import MessageBox from './MessageBox';
import Message from './types/Message';
import Sender from './types/Sender';
import { searchFunctionTags, parseFunctionArgs } from './utils';
import Tool from './types/Tool';
import tools from './tools';

const controller = new AbortController();
const signal = controller.signal;

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
  const [queryingModel, setQueryingModel] = useState<boolean>(false);
  const [abortDisabled, setAbortDisabled] = useState<boolean>(true);
  const steps = useRef<number>(0);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const messagesEndRef = useRef<any>(null); // TODO determine correct type
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const prompt = useRef<string>(default_tool_system_prompt);

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
    prompt.current = default_tool_system_prompt;
  }

  const handleSendMessage = async (message: Message) => {
    setQueryingModel(true);
    setInputMessage('');
    if (message) {
      prompt.current += message.text;
      prompt.current += "<|eot_id|><|start_header_id|>assistant<|end_header_id|>";
      setMessages(prevMessages => [...prevMessages, message]);

      let funcDescription;
      try {
        setMessages(prevMessages => [...prevMessages, { text: '', sender: Sender.AI }]);

        if (platform) {
          // TODO streamingFunctions shoudl be handled differently, not a match statement
          setAbortDisabled(false);
          let aiResponse: string = "";
          for await (const chunk of platform === 'aws' ? getAWSStreamingResponse({
            prompt: prompt.current,
            signal: signal,
          }) : getOllamaStreamingResponse({
            prompt: prompt.current,
            signal: signal,
          })) {
            aiResponse += chunk;
            setMessages(prevMessages => {
              const newMessages = [...prevMessages];
              newMessages[newMessages.length - 1].text = aiResponse.trimStart();
              return newMessages;
            });
          }
          setAbortDisabled(true);

          prompt.current += aiResponse;
          funcDescription = searchFunctionTags(aiResponse);
          if (funcDescription) {
            // TODO setup config to make max_steps
            if (steps.current < 10) {
              const tool: Tool = tools[funcDescription.name]
              const parsedArgs = parseFunctionArgs(funcDescription.args, tool.args);

              setMessages(prevMessages => [...prevMessages, {
                text: `Function ${funcDescription!.name} is being called.`,
                sender: Sender.SYSTEM,
              }]);
              const returnValue = tool.f(parsedArgs);
              prompt.current += "<|eot_id|><|start_header_id|>system<|end_header_id|>";
              const systemMessage: Message = {
                text: `Function '${funcDescription.name}' was called and returned ${returnValue}.`,
                sender: Sender.SYSTEM,
              }
              await handleSendMessage(systemMessage);
            } else {
              const systemMessage: Message = {
                text: 'Max function steps reached.',
                sender: Sender.SYSTEM,
              }
              setMessages(prevMessages => [...prevMessages, systemMessage]);
            }
          } else {
            prompt.current += "<|eot_id|><|start_header_id|>user<|end_header_id|>";
            setQueryingModel(false);
          }
        }
      } catch (error: any) {
        setQueryingModel(false);
        if (error.name === 'AbortError') {
          const systemMessage: Message = {
            text: 'Message stream aborted',
            sender: Sender.SYSTEM,
          }
          setMessages(prevMessages => [...prevMessages, systemMessage]);
        } else if (error.name === 'TypeError') {
          if (error.toString() === "TypeError: undefined is not an object (evaluating 'tool.args')") {
            const systemMessage: Message = {
              text: `Function ${funcDescription!.name} not found`,
              sender: Sender.SYSTEM,
            };
            setMessages(prevMessages => [...prevMessages, systemMessage]);
            console.error(`Function ${funcDescription!.name} not found`);
          }
        } else {
          console.error("Error: ", error.toString())
        }
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
            onSubmit={async (e: any) => {
              e.preventDefault();
              await handleSendMessage({
                text: inputMessage,
                sender: Sender.USER,
              });
            }}
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
              disabled={queryingModel}
            />
            <Button variant="contained" type="submit" sx={{ height: '56px' }}>Send</Button>
            <Button variant="contained" onClick={clearChat} sx={{ height: '56px' }}>Clear</Button>
            <Button disabled={abortDisabled}>
              <StopCircleIcon
                sx={{
                  height: '40px',
                  width: '40px'
                }}
                onClick={() => controller.abort()}
              />
            </Button>
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


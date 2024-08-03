import { useState, useEffect, useRef } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, TextField, Button, CircularProgress, Modal, Select, MenuItem } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { default_tool_system_prompt } from './prompts/default_tool_system_prompt';
import { getAWSStreamingResponse, getOllamaStreamingResponse } from './platforms';
import MessageBox from './MessageBox';
import Message from './types/Message';
import Sender from './types/Sender';
import { searchFunctionTags, parseFunctionArgs, getUserConfig } from './utils';
import Tool from './types/Tool';
import tools from './tools';
import Configuration from './Configuration';
import UserConfig from './types/UserConfig';

const theme = createTheme({
  typography: {
    fontFamily: 'monospace, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'monospace, sans-serif',
        },
      },
    },
  },
});

function App() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [queryingModel, setQueryingModel] = useState<boolean>(false);
  const [abortDisabled, setAbortDisabled] = useState<boolean>(true);
  const abortRef = useRef<AbortController | null>(null);
  const steps = useRef<number>(0);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const messagesEndRef = useRef<any>(null); // TODO determine correct type
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [config, setConfig] = useState<UserConfig | null>(null);
  const prompt = useRef<string>(default_tool_system_prompt);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load config on app load
  useEffect(() => {
    getUserConfig().then((config) => {
      setConfig(config);
      setLoading(false);
    });
  }, []);

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

        const controller = new AbortController();
        abortRef.current = controller;
        const signal = controller.signal;
        setAbortDisabled(false);
        let aiResponse: string = "";
        for await (const chunk of config!.platform === 'aws' ? getAWSStreamingResponse({
          prompt: prompt.current,
          signal: signal,
        }) : getOllamaStreamingResponse({
          prompt: prompt.current,
          signal: signal,
          url: config!.url,
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
          setMessages(prevMessages => prevMessages.slice(0, -1));
          // TODO setup config to make max_steps
          if (steps.current < 10) {
            const tool: Tool = tools[funcDescription.name]
            const parsedArgs = parseFunctionArgs(funcDescription.args, tool.args);

            setMessages(prevMessages => [...prevMessages, {
              text: `Calling function '${funcDescription!.name}'`,
              sender: Sender.SYSTEM,
            }]);
            const returnValue = await tool.f(parsedArgs);

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
    <ThemeProvider theme={theme}>
      {isLoading ? <CircularProgress size={100} /> :
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
                sx={{
                  height: '100%'
                }}
                disabled={queryingModel}
              />
              <Button
                variant="contained"
                type="submit"
                sx={{
                  height: "100%",
                }}
              >
                Send
              </Button>
              <Button
                variant="contained"
                onClick={clearChat}
                sx={{
                  height: "100%",
                }}
              >
                Clear
              </Button>
              <Button disabled={abortDisabled}>
                <StopCircleIcon
                  sx={{
                    height: '40px',
                    width: '40px'
                  }}
                  onClick={() => {
                    abortRef.current?.abort();
                    setAbortDisabled(true);
                  }}
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
        <Configuration config={config} setConfig={setConfig} setOpenModal={setOpenModal} />
      </Modal >
    </ThemeProvider>
  );
}

export default App;


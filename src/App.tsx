import { useState, useEffect, useRef } from 'react';
import { Box, Button, CircularProgress, Modal, Snackbar } from '@mui/material';
import { default_tool_system_prompt } from './prompts/default_tool_system_prompt';
import Message from './types/Message';
import Sender from './types/Sender';
import { parseFunctionArgs, getUserConfig, findJsonObject } from './utils';
import tools from './tools/tools';
import Tool from './types/Tool';
import Configuration from './Configuration';
import FuncDescription from './types/FuncDescription';
import InputBar from './InputBar';
import Messages from './Messages';
import StreamingClient from './clients/Client';
import { getStreamingClient } from './clients/factory';
import { invoke } from '@tauri-apps/api/tauri';
import FileTree from './FileTree';

function App() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [queryingModel, setQueryingModel] = useState<boolean>(false);
  const [abortDisabled, setAbortDisabled] = useState<boolean>(true);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);
  const steps = useRef<number>(0);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const messagesEndRef = useRef<any>(null);
  const [client, setClient] = useState<StreamingClient | null>(null);
  const [maxSteps, setMaxSteps] = useState<number>(10);
  const [messages, setMessages] = useState<Message[]>([{
    role: Sender.SYSTEM,
    content: default_tool_system_prompt,
  }]);
  const messagesRef = useRef<Message[]>([{
    role: Sender.SYSTEM,
    content: default_tool_system_prompt,
  }]);

  const setSnackBar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    getUserConfig().then((config) => {
      return getStreamingClient({
        platform: config.platform,
        options: {
          region: 'us-west-2', // for now this is hardcoded, aws only offers one region for this service
          model: config.model,
          temperature: config.temperature,
          top_p: config.top_p,
        }
      });
    })
      .then((client) => {
        setClient(client);
        setLoading(false);
      })
      .catch((error) => {
        setSnackBar(error.toString());
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearChat = (e: any) => {
    e.preventDefault();
    setMessages([{
      role: Sender.SYSTEM,
      content: default_tool_system_prompt,
    }]);
  }

  const handleSendMessage = async (message: Message) => {
    setQueryingModel(true);
    if (message) {
      messagesRef.current = [...messagesRef.current, message];
      setMessages(prevMessages => [...prevMessages, message]);

      let funcDescription: FuncDescription | null = null;
      // TODO handle no connection errors
      try {
        setMessages(prevMessages => [...prevMessages, { role: Sender.AI, content: '' }]);

        const abortController = new AbortController();
        abortRef.current = abortController;
        setAbortDisabled(false);
        let aiChunks = '';
        for await (const chunk of client!.getTextStream({
          messages: messagesRef.current,
          signal: abortRef.current.signal,
        })) {
          aiChunks += chunk;
          setMessages(prevMessages => {
            const newMessages = [...prevMessages];
            newMessages[newMessages.length - 1].content = aiChunks.trimStart();
            return newMessages;
          });
        }
        messagesRef.current = [...messagesRef.current, { role: Sender.AI, content: aiChunks.trimStart() }];
        setAbortDisabled(true);

        // TODO this can be refactored to separate function factory class
        funcDescription = findJsonObject(messagesRef.current[messagesRef.current.length - 1].content);
        if (funcDescription) {
          setMessages(prevMessages => prevMessages.slice(0, -1));
          if (steps.current < maxSteps) {
            const tool: Tool = tools[funcDescription.name]
            const parsedArgs: Record<string, string | number | boolean> = parseFunctionArgs(funcDescription.parameters, tool.args);

            setMessages(prevMessages => [...prevMessages, {
              content: `Calling function ${funcDescription!.name}(${Object.values(parsedArgs).join(', ')})`,
              role: Sender.SYSTEM,
            }]);
            const returnValue = await tool.f(parsedArgs);

            const systemMessage: Message = {
              content: `Function '${funcDescription.name}' was called and returned ${returnValue}.`,
              role: Sender.SYSTEM,
            }
            steps.current += 1;
            await handleSendMessage(systemMessage);
          } else {
            const systemMessage: Message = {
              content: 'Max function steps reached, function calling cancelled.',
              role: Sender.SYSTEM,
            }
            setMessages(prevMessages => [...prevMessages, systemMessage]);
            steps.current = 0;
          }
        } else {
          steps.current = 0;
          setQueryingModel(false);
        }
      } catch (error: any) {
        setQueryingModel(false);
        steps.current = 0;
        if (error.name === 'AbortError') {
          const systemMessage: Message = {
            content: 'Message stream aborted',
            role: Sender.SYSTEM,
          }
          setMessages(prevMessages => [...prevMessages, systemMessage]);
        } else if (error.name === 'TypeError') {
          if (error.toString() === "TypeError: undefined is not an object (evaluating 'tool.parameters')") {
            const systemMessage: Message = {
              content: `Function ${funcDescription!.name} not found`,
              role: Sender.SYSTEM,
            };
            setMessages(prevMessages => [...prevMessages, systemMessage]);
            console.error(`Function ${funcDescription!.name} not found`);
          }
        } else {
          setSnackBar(error.toString());
          console.error(error);
        }
      }
    }
  }

  return (
    <>
      {isLoading ? <CircularProgress size={100} /> :
        <Box sx={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
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
            <Messages messages={messages.slice(1)} messagesEndRef={messagesEndRef} />
            <InputBar
              handleSendMessage={handleSendMessage}
              queryingModel={queryingModel}
              clearChat={clearChat}
              abortDisabled={abortDisabled}
              setAbortDisabled={setAbortDisabled}
              abortRef={abortRef}
              setOpenModal={setOpenModal} />
          </Box>
          <Box sx={{
            width: '400px',
            borderLeft: '1px solid black',
            padding: '10px',
          }}>
            <FileTree />
          </Box>
        </Box>
      }
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box>
          <Configuration
            setClient={setClient}
            setOpenModal={setOpenModal}
            setSnackBar={setSnackBar}
            setMaxSteps={setMaxSteps}
          />
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
}

export default App;

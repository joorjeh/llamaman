import { useState, useEffect, useRef } from 'react';
import { Box, CircularProgress, Modal, Snackbar } from '@mui/material';
import { default_tool_system_prompt } from './prompts/default_tool_system_prompt';
import Message from './types/Message';
import Sender from './types/Sender';
import { parseFunctionArgs, getUserConfig, findJsonObject } from './utils';
import tools from './tools';
import Tool from './types/Tool';
import Configuration from './Configuration';
import FuncDescription from './types/FuncDescription';
import InputBar from './InputBar';
import Messages from './Messages';
import StreamingClient from './clients/Client';
import { getStreamingClient } from './clients/factory';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const prompt = useRef<string>(default_tool_system_prompt);
  const [client, setClient] = useState<StreamingClient | null>(null);
  const [maxSteps, setMaxSteps] = useState<number>(10);

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
    setMessages([]);
    prompt.current = default_tool_system_prompt;
  }

  const handleSendMessage = async (message: Message) => {
    setQueryingModel(true);
    if (message) {
      prompt.current += message.text;
      prompt.current += "<|eot_id|><|start_header_id|>assistant<|end_header_id|>";
      setMessages(prevMessages => [...prevMessages, message]);

      let funcDescription: FuncDescription | null = null;
      // TODO handle no connection errors
      try {
        setMessages(prevMessages => [...prevMessages, { text: '', sender: Sender.AI }]);

        const abortController = new AbortController();
        abortRef.current = abortController;
        setAbortDisabled(false);
        let aiResponse: string = "";
        for await (const chunk of client!.getTextStream({
          prompt: prompt.current,
          signal: abortRef.current.signal,
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
        funcDescription = findJsonObject(aiResponse);

        if (funcDescription) {
          setMessages(prevMessages => prevMessages.slice(0, -1));
          if (steps.current < maxSteps) {
            const tool: Tool = tools[funcDescription.name]
            const parsedArgs: Record<string, string | number | boolean> = parseFunctionArgs(funcDescription.parameters, tool.args);

            setMessages(prevMessages => [...prevMessages, {
              text: `Calling function ${funcDescription!.name}(${Object.values(parsedArgs).join(', ')})`,
              sender: Sender.SYSTEM,
            }]);
            const returnValue = await tool.f(parsedArgs);

            prompt.current += "<|eot_id|><|start_header_id|>system<|end_header_id|>";
            const systemMessage: Message = {
              text: `Function '${funcDescription.name}' was called and returned ${returnValue}.`,
              sender: Sender.SYSTEM,
            }
            steps.current += 1;
            await handleSendMessage(systemMessage);
          } else {
            const systemMessage: Message = {
              text: 'Max function steps reached.',
              sender: Sender.SYSTEM,
            }
            setMessages(prevMessages => [...prevMessages, systemMessage]);
          }
        } else {
          steps.current = 0;
          prompt.current += "<|eot_id|><|start_header_id|>user<|end_header_id|>";
          setQueryingModel(false);
        }
      } catch (error: any) {
        setQueryingModel(false);
        steps.current = 0;
        if (error.name === 'AbortError') {
          const systemMessage: Message = {
            text: 'Message stream aborted',
            sender: Sender.SYSTEM,
          }
          setMessages(prevMessages => [...prevMessages, systemMessage]);
        } else if (error.name === 'TypeError') {
          if (error.toString() === "TypeError: undefined is not an object (evaluating 'tool.parameters')") {
            const systemMessage: Message = {
              text: `Function ${funcDescription!.name} not found`,
              sender: Sender.SYSTEM,
            };
            setMessages(prevMessages => [...prevMessages, systemMessage]);
            console.error(`Function ${funcDescription!.name} not found`);
          }
        } else {
          setSnackBar(error.toString());
          // TODO not sure about this, it will add ANY error to chat, 
          // which the model probably cannot handle 
          // prompt.current += "<|eot_id|><|start_header_id|>system<|end_header_id|>";
          // const systemMessage: Message = {
          //   text: `Function ${funcDescription!.name} returned error ${error}`,
          //   sender: Sender.SYSTEM,
          // }
          // await handleSendMessage(systemMessage);
          // console.error("Error: ", error.toString())
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
            <Messages messages={messages} messagesEndRef={messagesEndRef} />
            <InputBar
              handleSendMessage={handleSendMessage}
              queryingModel={queryingModel}
              clearChat={clearChat}
              abortDisabled={abortDisabled}
              setAbortDisabled={setAbortDisabled}
              abortRef={abortRef}
              setOpenModal={setOpenModal} />
          </Box>
        </Box >
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

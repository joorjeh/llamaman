import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { default_tool_system_prompt } from './prompts/default_tool_system_prompt';

function App() {
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const generatePrompt = () => {
    let prompt = default_tool_system_prompt;
    messages.forEach((message) => {
      if (message.sender == 'user') {
        prompt += message.text;
        prompt += "<|eot_id|><|start_header_id|>assistant<|end_header_id|>";
      } else if (message.sender == 'ai') {
        prompt += message.text;
        prompt += "<|eot_id|><|start_header_id|>user<|end_header_id|>"
      }
    });
    return prompt;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      setMessages(prevMessages => [...prevMessages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');
      const prompt = generatePrompt();

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.1',
            prompt: prompt,
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch response from Ollama');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        setMessages(prevMessages => [...prevMessages, { text: '', sender: 'ai' }]);

        let intermediateValue = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim() !== '') {
              try {
                const parsed = JSON.parse(intermediateValue + line);
                aiResponse += parsed.response;
                setMessages(prevMessages => {
                  const newMessages = [...prevMessages];
                  newMessages[newMessages.length - 1].text = aiResponse;
                  return newMessages;
                });
                intermediateValue = '';
              } catch (error) {
                intermediateValue += line;
              }
            }
          }
        }
      } catch (error) {
        if (!error.toString().includes('Unexpected EOF')) {
          console.log('EOF');
        } else {
          console.error('Error querying Ollama:', error);
        }
      }
    }
  };

  return (
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
        <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: '10px' }}>
          <TextField
            fullWidth
            variant="outlined"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <Button type="submit" variant="contained">Send</Button>
        </Box>
      </Box>
    </Box>
  );
}

export default App;


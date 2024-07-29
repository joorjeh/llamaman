import React, { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim() !== '') {
      setMessages(prevMessages => [...prevMessages, { text: inputMessage, sender: 'user' }]);
      setInputMessage('');

      try {
        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3.1',
            prompt: inputMessage,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch response from Ollama');
        }

        const data = await response.json();
        setMessages(prevMessages => [...prevMessages, { text: data.response, sender: 'ai' }]);
      } catch (error) {
        console.error('Error querying Ollama:', error);
        setMessages(prevMessages => [...prevMessages, { text: 'Error: Unable to get response', sender: 'ai' }]);
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
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
      }}>
        {
          messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.sender === 'ai' ? 'flex-end' : 'flex-start'
              }}
            >
              <Box sx={{ maxWidth: '70%' }}>
                {message.text}
              </Box>
            </Box>
          ))
        }
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


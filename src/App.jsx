import React, { useState } from 'react';
import { Box } from '@mui/material';

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
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {
          messages.map((message, index) => (
            <div key={index} className={`message ${message.sender}`} style={{ justifyContent: message.sender === 'ai' ? 'flex-end' : 'flex-start' }}>
              {message.text}
            </div>
          ))
        }
      </Box>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </Box>
  );
}

export default App;


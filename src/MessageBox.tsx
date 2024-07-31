import { Box } from "@mui/material"
import Message from './types/Message';

const MessageBox = ({ message, index }: { message: Message, index: number }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: message.sender === 'ai' ? 'flex-end' : 'flex-start',
        marginTop: index === 0 ? 'auto' : 'initial',
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          padding: '10px',
          borderRadius: '10px',
          border: '1px solid lightgrey',
          backgroundColor: 'lightblue',
          whiteSpace: 'pre-wrap'
        }}
      >
        {message.text}
      </Box>
    </Box>
  )
}

export default MessageBox;

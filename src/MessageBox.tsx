import { Box } from "@mui/material"
import Sender from './types/Sender';
import Message from './types/Message';

const MessageBox = ({ message, index }: { message: Message, index: number }) => {
  let alignment;
  switch (message.sender) {
    case Sender.AI:
      alignment = 'flex-end';
      break;
    case Sender.USER:
      alignment = 'flex-start';
      break;
    case Sender.SYSTEM:
      alignment = 'center';
      break;
    default:
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: alignment,
        marginTop: index === 0 ? 'auto' : 'initial',
      }}
    >
      {
        message.sender === Sender.SYSTEM ?
          <Box
            sx={{
              maxWidth: '70%',
              padding: '10px',
              whiteSpace: 'pre-wrap',
              fontStyle: 'italic',
            }}
          >
            {message.text}
          </Box> :
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
      }
    </Box>
  )
}

export default MessageBox;

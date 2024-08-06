import { Box } from "@mui/material";
import MessageBox from "./MessageBox";
import Message from "./types/Message";

interface MessageBoxProps {
  messages: Message[];
  messagesEndRef: React.MutableRefObject<any>;
}

const Messages = ({
  messages,
  messagesEndRef,
}: MessageBoxProps) => {
  return (
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
  );
}

export default Messages;

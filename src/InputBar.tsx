import { Box, Button, TextField } from "@mui/material";
import Sender from "./types/Sender";
import { useState } from "react";
import Message from "./types/Message";
import SettingsIcon from '@mui/icons-material/Settings';
import StopCircleIcon from '@mui/icons-material/StopCircle';

interface InputBarProps {
  handleSendMessage: (message: Message) => Promise<void>;
  queryingModel: boolean;
  clearChat: (e: any) => void;
  abortDisabled: boolean;
  setAbortDisabled: (value: boolean) => void;
  abortRef: React.MutableRefObject<AbortController | null>;
  setOpenModal: (value: boolean) => void;
}

const InputBar = ({
  handleSendMessage,
  queryingModel,
  clearChat,
  abortDisabled,
  setAbortDisabled,
  abortRef,
  setOpenModal,
}: InputBarProps) => {
  const [inputMessage, setInputMessage] = useState<string>('');

  return (
    <>
      <Box
        component="form"
        onSubmit={(e: any) => {
          e.preventDefault();
          handleSendMessage({
            content: inputMessage,
            role: Sender.USER,
          }).then(() => {
            setInputMessage('');
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
    </>
  )
}

export default InputBar;

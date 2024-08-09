import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
import { createTheme } from "@mui/material";
import { ThemeProvider } from "@emotion/react";

const theme = createTheme({
  typography: {
    // fontFamily: 'monospace, sans-serif',
    fontFamily: 'sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          // fontFamily: 'monospace, sans-serif',
          fontFamily: 'sans-serif',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {BrowserRouter} from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: "#1565c0",
    },
    text: {
      primary: "#fff"
    },
    background:{
      default: "#353a42"
    },
    secondary:{
      main: "#272727"
    }
  }
});
ReactDOM.render(
  <React.StrictMode>
  <BrowserRouter>
  <ThemeProvider theme={darkTheme}>
  <CssBaseline enableColorScheme/>
    <App />
  </ThemeProvider>
  </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);


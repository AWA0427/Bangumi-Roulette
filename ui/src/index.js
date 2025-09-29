import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#673ab7' }, // 自定义主题色
  },
});

const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#6200EE' },
    },
});

function Root() {
  const [themeMode, setThemeMode] = React.useState('light');
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  // 将主题切换功能暴露给 Python
  window.toggleTheme = (newMode) => {
    setThemeMode(newMode);
  };

  return (
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);

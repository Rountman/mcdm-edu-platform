import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import ModuleContent from './components/ModuleContent';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0057FF' },
    secondary: { main: '#FF3B5C' },
    background: { default: '#f2f5fb', paper: '#ffffff' },
    text: {
      primary: '#0D1526',
      secondary: '#5c6f91',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
  },
});

function App() {
  const [activeMenu, setActiveMenu] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          setActiveTab={setActiveTab}
        />
        <ModuleContent
          activeMenu={activeMenu}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;

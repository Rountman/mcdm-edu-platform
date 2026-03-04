// frontend/src/App.jsx
import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import ModuleContent from './components/ModuleContent';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { default: '#f5f7fa', paper: '#ffffff' }
  },
  typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }
});

function App() {
  const [activeMenu, setActiveMenu] = useState(3); // 3 = Metoda AHP
  const [activeTab, setActiveTab] = useState(0);   // 0 = Teorie

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        
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
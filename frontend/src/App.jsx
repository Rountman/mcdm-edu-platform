import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import Sidebar from './components/Sidebar';
import ModuleContent from './components/ModuleContent';

// Pořadí odpovídá menuItems v Sidebar.jsx
const MODULE_SLUGS = ['ahp', 'smart', 'paprika', 'citlivost', 'stromy'];
const TAB_SLUGS = ['teorie', 'lab'];

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

function ModulePage() {
  const { module, tab } = useParams();
  const navigate = useNavigate();
  const activeMenu = MODULE_SLUGS.indexOf(module);
  const activeTab = TAB_SLUGS.indexOf(tab);
  if (activeMenu < 0 || activeTab < 0) return <Navigate to="/ahp/teorie" replace />;

  // Výběr modulu vždy otevře jeho teorii (stejně jako dřív)
  const setActiveMenu = (i) => navigate(`/${MODULE_SLUGS[i]}/${TAB_SLUGS[0]}`);
  const setActiveTab = (t) => navigate(`/${module}/${TAB_SLUGS[t]}`);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <ModuleContent activeMenu={activeMenu} activeTab={activeTab} setActiveTab={setActiveTab} />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/:module/:tab" element={<ModulePage />} />
        <Route path="*" element={<Navigate to="/ahp/teorie" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

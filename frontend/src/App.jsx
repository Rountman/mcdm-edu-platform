import { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import Sidebar from './components/Sidebar';
import ModuleContent from './components/ModuleContent';
import { MODULES, TAB_SLUGS } from './components/modules';
import { tokens } from './styles/tokens';

const MODULE_SLUGS = MODULES.map((m) => m.slug);
const TEXT_SIZE_KEY = 'mcdm-text-size';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tokens.primary, dark: tokens.primaryHover },
    secondary: { main: tokens.secondary },
    error: { main: tokens.danger },
    success: { main: tokens.success },
    background: { default: tokens.bg, paper: tokens.surface },
    text: { primary: tokens.text, secondary: tokens.textMuted },
    divider: tokens.border,
  },
  shape: { borderRadius: tokens.radius },
  typography: {
    fontFamily: tokens.fontSans,
    button: { textTransform: 'none', fontWeight: 600 },
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
  },
  components: {
    MuiTab: {
      styleOverrides: {
        root: { fontSize: '1rem', minHeight: 52 },
      },
    },
  },
});

function readTextSize() {
  try {
    return localStorage.getItem(TEXT_SIZE_KEY) === 'large';
  } catch {
    return false;
  }
}

function ModulePage({ largeText, onToggleLargeText }) {
  const { module, tab } = useParams();
  const navigate = useNavigate();
  const activeMenu = MODULE_SLUGS.indexOf(module);
  const activeTab = TAB_SLUGS.indexOf(tab);
  if (activeMenu < 0 || activeTab < 0) return <Navigate to="/ahp/teorie" replace />;

  // Výběr modulu vždy otevře jeho teorii (stejně jako dřív)
  const setActiveMenu = (i) => navigate(`/${MODULE_SLUGS[i]}/${TAB_SLUGS[0]}`);
  const setActiveTab = (t) => navigate(`/${module}/${TAB_SLUGS[t]}`);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: '100dvh', bgcolor: 'background.default' }}>
      <a className="skip-link" href="#main-content" onClick={(e) => {
        // HashRouter: kotvu řešíme ručně, aby se nezměnila trasa
        e.preventDefault();
        document.getElementById('main-content')?.focus();
      }}
      >
        Přeskočit na obsah
      </a>
      <Sidebar
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        largeText={largeText}
        onToggleLargeText={onToggleLargeText}
      />
      <ModuleContent activeMenu={activeMenu} activeTab={activeTab} setActiveTab={setActiveTab} />
    </Box>
  );
}

function App() {
  const [largeText, setLargeText] = useState(readTextSize);

  useEffect(() => {
    document.documentElement.dataset.textSize = largeText ? 'large' : 'normal';
    try {
      localStorage.setItem(TEXT_SIZE_KEY, largeText ? 'large' : 'normal');
    } catch {
      // úložiště nemusí být dostupné (soukromé okno) – volba pak platí jen do obnovení
    }
  }, [largeText]);

  const page = <ModulePage largeText={largeText} onToggleLargeText={() => setLargeText((v) => !v)} />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/:module/:tab" element={page} />
        <Route path="*" element={<Navigate to="/ahp/teorie" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

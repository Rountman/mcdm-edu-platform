import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import Sidebar from './components/Sidebar';
import ModuleContent from './components/ModuleContent';
import { MODULES, TAB_SLUGS } from './components/modules';
import { tokens } from './styles/tokens';
import { LanguageProvider } from './i18n/LanguageContext';
import { useLang } from './i18n/lang';

const MODULE_SLUGS = MODULES.map((m) => m.slug);

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

function ModulePage() {
  const { module, tab } = useParams();
  const navigate = useNavigate();
  const { tr } = useLang();
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
        {tr('Přeskočit na obsah', 'Skip to content')}
      </a>
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <ModuleContent activeMenu={activeMenu} activeTab={activeTab} setActiveTab={setActiveTab} />
    </Box>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/:module/:tab" element={<ModulePage />} />
          <Route path="*" element={<Navigate to="/ahp/teorie" replace />} />
        </Routes>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;

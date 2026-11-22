import { lazy, Suspense, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { MODULES, TAB_LABELS } from './modules';
import { useLang } from '../i18n/lang';

const AHPInputTable      = lazy(() => import('./ahp/AHPInputTable'));
const AHPTheory          = lazy(() => import('./ahp/AHPTheory'));
const SMARTLab           = lazy(() => import('./smart/SMARTLab'));
const SMARTTheory        = lazy(() => import('./smart/SMARTTheory'));
const PAPRIKALab         = lazy(() => import('./paprika/PAPRIKALab'));
const PAPRIKATheory      = lazy(() => import('./paprika/PAPRIKATheory'));
const SensitivityLab     = lazy(() => import('./sensitivity/SensitivityLab'));
const SensitivityTheory  = lazy(() => import('./sensitivity/SensitivityTheory'));
const DecisionTreeLab    = lazy(() => import('./dtree/DecisionTreeLab'));
const DecisionTreeTheory = lazy(() => import('./dtree/DecisionTreeTheory'));

const THEORY_COMPONENTS = [AHPTheory, SMARTTheory, PAPRIKATheory, SensitivityTheory, DecisionTreeTheory];
const LAB_COMPONENTS    = [AHPInputTable, SMARTLab, PAPRIKALab, SensitivityLab, DecisionTreeLab];

export default function ModuleContent({ activeMenu, activeTab, setActiveTab }) {
  const TheoryComponent = THEORY_COMPONENTS[activeMenu] ?? null;
  const LabComponent    = LAB_COMPONENTS[activeMenu] ?? null;
  const { lang, tr } = useLang();
  const headingRef = useRef(null);
  const prevMenu = useRef(activeMenu);

  // Po přepnutí modulu přesunout focus na nadpis (čtečky ohlásí novou stránku).
  // Porovnání s předchozí hodnotou funguje i při dvojím spuštění efektu ve StrictMode.
  useEffect(() => {
    if (prevMenu.current === activeMenu) return;
    prevMenu.current = activeMenu;
    headingRef.current?.focus();
  }, [activeMenu]);

  useEffect(() => {
    document.title = `${MODULES[activeMenu].label[lang]} – ${TAB_LABELS[activeTab][lang]} | MCDM Edu`;
  }, [activeMenu, activeTab, lang]);

  return (
    <Box
      component="main"
      id="main-content"
      tabIndex={-1}
      sx={{
        flexGrow: 1,
        minWidth: 0,
        p: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        flexDirection: 'column',
        '&:focus': { outline: 'none' },
      }}
    >
      <Box className="lab-shell" sx={{ mb: { xs: 2, md: 3 } }}>
        <Typography ref={headingRef} tabIndex={-1} className="lab-title" component="h1" sx={{ '&:focus': { outline: 'none' } }}>
          {MODULES[activeMenu].label[lang]}
        </Typography>
      </Box>

      <Paper elevation={0} className="lab-shell lab-panel" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box className="lab-tabs">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label={tr('Část modulu', 'Module section')}
            variant="fullWidth"
            sx={{ maxWidth: 480 }}
          >
            {TAB_LABELS.map((label, i) => (
              <Tab key={label.cs} label={label[lang]} id={`module-tab-${i}`} aria-controls="module-tabpanel" />
            ))}
          </Tabs>
        </Box>

        <Box
          id="module-tabpanel"
          role="tabpanel"
          aria-labelledby={`module-tab-${activeTab}`}
          sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}
        >
          <Suspense fallback={<Box role="status" sx={{ p: 3, color: 'text.secondary' }}>{tr('Načítání…', 'Loading…')}</Box>}>
            {activeTab === 0 && (
              TheoryComponent
                ? <TheoryComponent />
                : <Typography variant="body1" color="text.secondary">{tr('Teorie se připravuje…', 'Theory is being prepared…')}</Typography>
            )}
            {activeTab === 1 && (
              LabComponent
                ? <LabComponent />
                : <Typography variant="body1" color="text.secondary">{tr('Laboratoř se připravuje…', 'Lab is being prepared…')}</Typography>
            )}
          </Suspense>
        </Box>
      </Paper>
    </Box>
  );
}

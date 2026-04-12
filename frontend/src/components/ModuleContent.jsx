import { lazy, Suspense } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { menuItems } from './Sidebar';

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

  return (
    <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column' }}>
      <Box className="lab-shell" sx={{ mb: 3 }}>
        <Typography className="lab-title" component="h1">
          {menuItems[activeMenu]}
        </Typography>
        <Typography className="lab-subtitle" component="p">
          Vyberte záložku teorie nebo lab.
        </Typography>
      </Box>

      <Paper elevation={0} className="lab-shell lab-panel" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box className="lab-tabs">
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} centered>
            <Tab label="Teorie a princip" />
            <Tab label="Lab (Výpočet)" />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          <Suspense fallback={<Box sx={{ p: 3, color: 'text.secondary', fontSize: '0.875rem' }}>Načítání…</Box>}>
            {activeTab === 0 && (
              TheoryComponent
                ? <TheoryComponent />
                : <Typography variant="body1" color="text.secondary">Teorie se připravuje…</Typography>
            )}
            {activeTab === 1 && (
              LabComponent
                ? <LabComponent />
                : <Typography variant="body1" color="text.secondary">Laboratoř se připravuje…</Typography>
            )}
          </Suspense>
        </Box>
      </Paper>
    </Box>
  );
}

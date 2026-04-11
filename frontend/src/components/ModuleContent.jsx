import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { menuItems } from './Sidebar';
import AHPInputTable from './ahp/AHPInputTable';
import AHPTheory from './ahp/AHPTheory';
import SMARTLab from './smart/SMARTLab';
import SMARTTheory from './smart/SMARTTheory';
import PAPRIKALab from './paprika/PAPRIKALab';
import PAPRIKATheory from './paprika/PAPRIKATheory';
import SensitivityLab from './sensitivity/SensitivityLab';
import SensitivityTheory from './sensitivity/SensitivityTheory';
import DecisionTreeLab from './dtree/DecisionTreeLab';
import DecisionTreeTheory from './dtree/DecisionTreeTheory';

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
        </Box>
      </Paper>
    </Box>
  );
}

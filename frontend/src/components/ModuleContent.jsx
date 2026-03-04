import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { menuItems } from './Sidebar';
import AHPInputTable from './AHPInputTable';

export default function ModuleContent({ activeMenu, activeTab, setActiveTab }) {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column' }}>
      
      {/* HLAVIČKA */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          {menuItems[activeMenu]}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Vyberte si záložku pro zobrazení teorie nebo spuštění výpočetního modelu.
        </Typography>
      </Box>

      {/* KARTA S OBSAHEM */}
      <Paper elevation={2} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
            <Tab label="📖 Teorie a princip" />
            <Tab label="🧪 Laboratoř (Výpočet)" />
          </Tabs>
        </Box>

        {/* OBSAH ZÁLOŽEK */}
        <Box sx={{ p: 4, overflowY: 'visible' }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6">Základní princip metody</Typography>
              <Typography variant="body1">Zde bude vysvětlující text k tématu: <strong>{menuItems[activeMenu]}</strong>.</Typography>
            </Box>
          )}

        {/* Obsah pro Laboratoř (pokud je vybrána druhá záložka) */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Interaktivní model</Typography>
              
              {/* Pokud je vybráno AHP (index 3), ukážeme naši AHP kalkulačku */}
              {activeMenu === 3 ? (
                <AHPInputTable />
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Laboratoř pro toto téma se připravuje...
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
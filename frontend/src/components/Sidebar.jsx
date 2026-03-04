import { Drawer, Box, Typography, Divider, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

const drawerWidth = 280;

export const menuItems = [
  "Simonův model a Metodologie",
  "Struktura systémů DSS a data",
  "Rozhodování za rizika a nejistoty",
  "Metoda AHP",
  "Metoda ANP",
  "Další vícekriteriální metody"
];

export default function Sidebar({ activeMenu, setActiveMenu, setActiveTab }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" fontWeight="bold">MCDM Edu 🎓</Typography>
        <Typography variant="caption">Výuková platforma</Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton 
              selected={activeMenu === index}
              onClick={() => {
                setActiveMenu(index);
                setActiveTab(0);
              }}
            >
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
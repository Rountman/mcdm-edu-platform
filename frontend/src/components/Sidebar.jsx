import {
  Drawer,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';

const drawerWidth = 280;

export const menuItems = [
  'Metoda AHP',
  'Metoda SMART',
  'Metoda PAPRIKA',
  'Analýza citlivosti',
  'Rozhodovací stromy',
];

export default function Sidebar({ activeMenu, setActiveMenu, setActiveTab }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid #dde3ed',
          backgroundColor: '#f8faff',
        },
      }}
    >
      <Box sx={{ p: 2.5, textAlign: 'center', bgcolor: '#0057FF', color: '#fff' }}>
        <Typography variant="h6" fontWeight="bold">MCDM Edu</Typography>
        <Typography variant="caption">Výuková  platforma</Typography>
      </Box>
      <Divider />
      <List sx={{ p: 1 }}>
        {menuItems.map((text, index) => (
          <ListItem key={text} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={activeMenu === index}
              onClick={() => {
                setActiveMenu(index);
                setActiveTab(0);
              }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0,87,255,0.12)',
                  color: '#0d1526',
                  fontWeight: 700,
                },
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

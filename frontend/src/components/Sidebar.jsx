import { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Logo from './Logo';
import { MODULES, TAB_SLUGS } from './modules';

const drawerWidth = 272;

function Brand() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Logo size={36} />
      <Box>
        <Typography component="p" sx={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2, color: 'text.primary' }}>
          MCDM Edu
        </Typography>
        <Typography component="p" sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.3 }}>
          Vícekriteriální rozhodování
        </Typography>
      </Box>
    </Box>
  );
}

function TextSizeToggle({ largeText, onToggle }) {
  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      <button
        type="button"
        className="u-tbtn"
        aria-pressed={largeText}
        onClick={onToggle}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 19 8 5l5 14M4.8 14h6.4M14 19l3.5-9 3.5 9M15.2 16h4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {largeText ? 'Běžné písmo' : 'Velké písmo (projektor)'}
      </button>
    </Box>
  );
}

function NavList({ activeMenu, onSelect }) {
  return (
    <Box component="nav" aria-label="Moduly">
      <List sx={{ p: 1.5 }}>
        {MODULES.map(({ slug, label }, index) => {
          const active = activeMenu === index;
          return (
            <ListItem key={slug} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component="a"
                href={`#/${slug}/${TAB_SLUGS[0]}`}
                aria-current={active ? 'page' : undefined}
                selected={active}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(index);
                }}
                sx={{
                  borderRadius: 2,
                  minHeight: 48,
                  color: 'text.primary',
                  borderLeft: '4px solid transparent',
                  '&.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: 'rgba(0,87,255,0.10)',
                    borderLeftColor: 'primary.main',
                  },
                }}
              >
                <ListItemText
                  primary={label}
                  slotProps={{ primary: { sx: { fontSize: '1rem', fontWeight: active ? 700 : 500 } } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

export default function Sidebar({ activeMenu, setActiveMenu, largeText, onToggleLargeText }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [open, setOpen] = useState(false);

  const content = (onSelect) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Brand />
      </Box>
      <NavList activeMenu={activeMenu} onSelect={onSelect} />
      <Box sx={{ mt: 'auto' }}>
        <TextSizeToggle largeText={largeText} onToggle={onToggleLargeText} />
      </Box>
    </Box>
  );

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        {content(setActiveMenu)}
      </Drawer>
    );
  }

  return (
    <>
      <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#FFFFFF' }}>
        <Toolbar sx={{ gap: 1, minHeight: 60 }}>
          <IconButton
            edge="start"
            aria-label="Otevřít menu modulů"
            aria-expanded={open}
            aria-controls="module-drawer"
            onClick={() => setOpen(true)}
            sx={{ width: 48, height: 48 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </IconButton>
          <Brand />
        </Toolbar>
      </AppBar>
      <Drawer
        id="module-drawer"
        variant="temporary"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: drawerWidth, maxWidth: '85vw', boxSizing: 'border-box' } }}
      >
        {content((i) => {
          setOpen(false);
          setActiveMenu(i);
        })}
      </Drawer>
    </>
  );
}

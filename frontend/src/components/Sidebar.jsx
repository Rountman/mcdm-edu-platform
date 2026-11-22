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
import { useLang } from '../i18n/lang';

const drawerWidth = 272;

function Brand({ compact = false }) {
  const { tr } = useLang();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Logo size={36} />
      <Box sx={{ minWidth: 0 }}>
        <Typography component="p" sx={{ fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.2, color: 'text.primary' }}>
          MCDM Edu
        </Typography>
        {!compact && (
          <Typography component="p" sx={{ fontSize: '0.875rem', color: 'text.secondary', lineHeight: 1.3 }}>
            {tr('Vícekriteriální rozhodování', 'Multi-criteria decision making')}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// Přepínač jazyka: dvě tlačítka se stavem aria-pressed; zkratka je viditelná, plný název čte čtečka
function LanguageSwitch() {
  const { lang, setLang, tr } = useLang();
  const options = [
    { code: 'cs', short: 'CZ', name: 'Čeština' },
    { code: 'en', short: 'EN', name: 'English' },
  ];
  return (
    <div className="lang-switch" role="group" aria-label={tr('Jazyk', 'Language')}>
      {options.map((o) => (
        <button
          key={o.code}
          type="button"
          lang={o.code}
          className={`lang-switch-btn${lang === o.code ? ' lang-switch-btn--active' : ''}`}
          aria-pressed={lang === o.code}
          aria-label={o.name}
          onClick={() => setLang(o.code)}
        >
          {o.short}
        </button>
      ))}
    </div>
  );
}

function NavList({ activeMenu, onSelect }) {
  const { lang, tr } = useLang();
  return (
    <Box component="nav" aria-label={tr('Moduly', 'Modules')}>
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
                  primary={label[lang]}
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

export default function Sidebar({ activeMenu, setActiveMenu }) {
  const theme = useTheme();
  const { tr } = useLang();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [open, setOpen] = useState(false);

  const content = (onSelect) => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, py: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Brand />
      </Box>
      <NavList activeMenu={activeMenu} onSelect={onSelect} />
      <Box sx={{ mt: 'auto', p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography component="span" sx={{ fontSize: '0.875rem', color: 'text.secondary', fontWeight: 600 }}>
          {tr('Jazyk', 'Language')}
        </Typography>
        <LanguageSwitch />
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
            aria-label={tr('Otevřít menu modulů', 'Open module menu')}
            aria-expanded={open}
            aria-controls="module-drawer"
            onClick={() => setOpen(true)}
            sx={{ width: 48, height: 48 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Brand compact />
          </Box>
          <LanguageSwitch />
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

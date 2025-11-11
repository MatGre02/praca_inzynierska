import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as EventIcon,
  Group as GroupIcon,
  Mail as MailIcon,
  Logout as LogoutIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  AdminPanelSettings as AdminIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const menuOpen = Boolean(anchorEl);

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/', show: true },
    { label: 'Kalendarz', icon: <EventIcon />, path: '/events', show: true },
    { label: 'Kadra Meczowa', icon: <GroupIcon />, path: '/squad', show: true },
    { label: 'Statystyki', icon: <DescriptionIcon />, path: '/stats', show: user?.rola !== 'ZAWODNIK' },
    { label: 'Wiadomości', icon: <MailIcon />, path: '/messages', show: user?.rola !== 'ZAWODNIK' },
    { label: 'Raporty', icon: <DescriptionIcon />, path: '/reports', show: user?.rola === 'PREZES' },
    { label: 'Admin', icon: <AdminIcon />, path: '/admin', show: user?.rola === 'PREZES' },
    { label: 'O klubie', icon: <InfoIcon />, path: '/contact', show: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, cursor: 'pointer', userSelect: 'none' }}
            onClick={() => navigate('/')}
          >
            System Zarządzania Klubem Piłkarskim
          </Typography>
          <Button
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ textTransform: 'none', fontSize: '1rem', mr: 2 }}
          >
            {user?.imie} {user?.nazwisko} ({user?.rola})
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem
              onClick={() => {
                navigate('/change-password');
                setAnchorEl(null);
              }}
            >
              <LockIcon sx={{ mr: 1 }} /> Zmień hasło
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleLogout();
                setAnchorEl(null);
              }}
            >
              <LogoutIcon sx={{ mr: 1 }} /> Wyloguj
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ width: 250 }}
      >
        <List sx={{ pt: 8 }}>
          {menuItems.map((item) =>
            item.show ? (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    setDrawerOpen(false);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ) : null
          )}
        </List>
      </Drawer>

      <Box sx={{ width: '100%', mt: 8, p: 3 }}>
        {children}
      </Box>
    </Box>
  );
};

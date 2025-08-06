import React, { useState, useEffect } from 'react';
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  styled,
  BottomNavigation,
  BottomNavigationAction,
  Snackbar,
  Alert,
  Paper,
  Avatar,
  Divider,
} from '@mui/material';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import CasinoIcon from '@mui/icons-material/Casino';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
import ArticleIcon from '@mui/icons-material/Article';

import RoulettePage from './RoulettePage';
import SettingsPage from './SettingsPage';

const DraggableAppBar = styled(AppBar)(({ theme }) => ({
  '-webkit-app-region': 'drag',
  'box-shadow': 'none',
  'border-bottom': `1px solid ${theme.palette.divider}`,
  'position': 'fixed',
  'width': '100%',
  'top': 0,
  'left': 0,
  [theme.breakpoints.down('sm')]: {
    '-webkit-app-region': 'no-drag',
  },
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: 240,
    boxSizing: 'border-box',
    borderRight: 'none',
    [theme.breakpoints.up('sm')]: {
      top: 0,
    },
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
}));

function AppContent() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [mode, setMode] = useState('dark');
  const [accentColor, setAccentColor] = useState('#1976d2');
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'));
  
  window.showSnackbar = (severity, message) => {
    setSnackbar({ open: true, message, severity });
  };
  window.updateUserInfo = (info) => {
    setUserInfo(info);
    window.showSnackbar('success', `欢迎, ${info.username}!`);
  };

  useEffect(() => {
    if (window.pywebview && window.pywebview.api.get_system_accent_color) {
      window.pywebview.api.get_system_accent_color().then(response => {
        if (response.success && response.color) {
          setAccentColor(response.color);
        }
      });
    }
  }, []);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleDrawerToggle = () => {
    setOpenDrawer(!openDrawer);
  };

  const handleThemeToggle = () => {
    setMode(prevMode => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  const handleLoginClick = () => {
    if (window.pywebview && window.pywebview.api.start_login_flow) {
      window.pywebview.api.start_login_flow();
    } else {
      window.showSnackbar('error', 'Pywebview API 或 start_login_flow 方法不可用');
    }
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: accentColor,
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1d1d1d' : '#ffffff',
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            textTransform: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '8px 16px',
            '&.Mui-selected': {
              backgroundColor: theme => theme.palette.primary.main,
              color: theme => theme.palette.primary.contrastText,
              '& .MuiListItemIcon-root': {
                color: theme => theme.palette.primary.contrastText,
              },
            },
          },
        },
      },
    },
  });

  const SideDrawerContent = (
    <Box sx={{ width: 240, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={userInfo?.avatar_url || ''} alt={userInfo?.username || ''} />
        <Typography variant="h6">{userInfo?.username || '未登录'}</Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        <ListItemButton onClick={() => navigate('/')}>
          <ListItemIcon><CasinoIcon /></ListItemIcon>
          <ListItemText primary="轮盘" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/settings')}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="设置" />
        </ListItemButton>
        <ListItemButton onClick={handleThemeToggle}>
          <ListItemIcon>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </ListItemIcon>
          <ListItemText primary="切换主题" />
        </ListItemButton>
      </List>
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleLoginClick}
          sx={{ display: userInfo ? 'none' : 'flex' }}
        >
          <AccountCircleIcon sx={{ mr: 1 }} /> 登录
        </Button>
        <Button
          fullWidth
          variant="outlined"
          color="inherit"
          sx={{ display: userInfo ? 'flex' : 'none', color: 'text.secondary' }}
        >
          <LogoutIcon sx={{ mr: 1 }} /> 退出登录
        </Button>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {!isMobile && (
        <StyledDrawer variant="permanent" open>
          <Toolbar /> {/* 占位符，以防内容被 AppBar 遮挡 */}
          {SideDrawerContent}
        </StyledDrawer>
      )}

      {isMobile && (
        <DraggableAppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Bangumi Roulette
            </Typography>
            <IconButton color="inherit" onClick={handleThemeToggle}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </DraggableAppBar>
      )}

      {isMobile && (
        <StyledDrawer variant="temporary" open={openDrawer} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}>
          {SideDrawerContent}
        </StyledDrawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: isMobile ? 0 : '240px',
          mt: isMobile ? '56px' : '0',
          mb: isMobile ? '56px' : '0',
        }}
      >
        {!isMobile && <Toolbar />}
        <Routes>
          <Route path="/" element={<RoulettePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Box>
      
      {isMobile && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
          <BottomNavigation showLabels>
            <BottomNavigationAction label="轮盘" icon={<CasinoIcon />} onClick={() => navigate('/')} />
            <BottomNavigationAction label="设置" icon={<SettingsIcon />} onClick={() => navigate('/settings')} />
          </BottomNavigation>
        </Paper>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
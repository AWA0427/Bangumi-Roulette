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
} from '@mui/material';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import CasinoIcon from '@mui/icons-material/Casino';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// 导入页面组件
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

function AppContent() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [mode, setMode] = useState('dark');
  const [accentColor, setAccentColor] = useState('#1976d2');
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme => theme.breakpoints.down('md') && theme.breakpoints.up('sm'));

  window.showSnackbar = (severity, message) => {
    setSnackbar({ open: true, message, severity });
  };
  window.updateUserInfo = (userInfo) => {
    console.log("用户信息已更新：", userInfo);
    window.showSnackbar('success', `欢迎, ${userInfo.username}!`);
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
      borderRadius: 12,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12, // 确保所有 Paper 都有圆角
          },
        },
      },
    },
  });

  const drawer = (
    <Box sx={{ width: isMobile ? '100%' : 240 }} role="presentation" onClick={handleDrawerToggle}>
      <List>
        <ListItemButton onClick={() => navigate('/')}>
          <ListItemIcon><CasinoIcon /></ListItemIcon>
          <ListItemText primary="轮盘" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/settings')}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="设置" />
        </ListItemButton>
        <ListItemButton onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
          <ListItemIcon>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </ListItemIcon>
          <ListItemText primary="切换主题" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DraggableAppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {(isMobile || isTablet) && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, '-webkit-app-region': 'no-drag' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, '-webkit-app-region': 'no-drag' }}>
            Bangumi Roulette
          </Typography>
          {!isMobile && (
            <IconButton color="inherit" onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} sx={{ '-webkit-app-region': 'no-drag' }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          )}
        </Toolbar>
      </DraggableAppBar>

      <Box sx={{ display: 'flex' }}>
        {!isMobile && !isTablet && (
          <Drawer
            variant="permanent"
            open
            sx={{
              width: 240,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box', top: '64px' },
            }}
          >
            <Box sx={{ height: '64px', '-webkit-app-region': 'drag' }} />
            {drawer}
          </Drawer>
        )}
        {(isMobile || isTablet) && (
          <Drawer
            variant="temporary"
            open={openDrawer}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
            }}
          >
            {drawer}
          </Drawer>
        )}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 240px)` },
            mt: isMobile ? '56px' : '64px', // 适应不同尺寸的 AppBar 高度
            mb: isMobile ? '56px' : '0',   // 移动端底部导航栏高度
          }}
        >
          <Routes>
            <Route path="/" element={<RoulettePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Box>
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

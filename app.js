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
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import CasinoIcon from '@mui/icons-material/Casino';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';

import RoulettePage from './RoulettePage';
import SettingsPage from './SettingsPage';

// 样式化 Drawer，以实现桌面端常驻和移动端临时抽屉
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: 280, // 稍微加宽以容纳更多内容，更符合 MD3 规范
    boxSizing: 'border-box',
    borderRight: 'none',
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.up('md')]: {
      top: 0,
    },
    [theme.breakpoints.down('md')]: {
      width: '100%',
    },
  },
}));

function AppContent() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [mode, setMode] = useState('dark');
  const [accentColor, setAccentColor] = useState('#6750A4'); // 使用 MD3 默认紫色作为fallback
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md')); // 适配平板和手机
  
  window.showSnackbar = (severity, message) => {
    setSnackbar({ open: true, message, severity });
  };
  window.updateUserInfo = (info) => {
    setUserInfo(info);
    window.showSnackbar('success', `欢迎, ${info.username}!`);
  };

  useEffect(() => {
    // 获取系统强调色
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

  // 创建一个 MD3 风格的主题
  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: accentColor,
      },
      secondary: {
        main: mode === 'dark' ? '#CFC4DB' : '#6A5F7B',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1D1D1D' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#E6E1E5' : '#1D1B20',
        secondary: mode === 'dark' ? '#CAC4D0' : '#49454F',
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
        defaultProps: {
          variant: 'contained', // 将默认按钮样式设置为 Filled
        },
        styleOverrides: {
          root: {
            borderRadius: 24, // MD3 中按钮的圆角更大
            textTransform: 'none',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            }
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            margin: '8px 16px',
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
              '& .MuiListItemIcon-root': {
                color: theme.palette.primary.contrastText,
              },
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: theme.palette.background.paper,
          },
        },
      },
    },
  });

  const SideDrawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={userInfo?.avatar_url || ''} alt={userInfo?.username || ''} />
        <Typography variant="h6">{userInfo?.username || '未登录'}</Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1 }}>
        <ListItemButton onClick={() => navigate('/')} selected={location.pathname === '/'}>
          <ListItemIcon><CasinoIcon /></ListItemIcon>
          <ListItemText primary="轮盘" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/settings')} selected={location.pathname === '/settings'}>
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
          variant="filled"
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
      
      {/* 桌面端常驻侧边导航栏 */}
      {!isMobile && (
        <StyledDrawer variant="permanent" open>
          <Toolbar />
          {SideDrawerContent}
        </StyledDrawer>
      )}

      {/* 移动端顶部栏和临时抽屉 */}
      {isMobile && (
        <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1, backgroundColor: theme.palette.background.paper }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, color: theme.palette.text.primary }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: theme.palette.text.primary }}>
              Bangumi Roulette
            </Typography>
            <IconButton color="inherit" onClick={handleThemeToggle} sx={{ color: theme.palette.text.primary }}>
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {isMobile && (
        <StyledDrawer variant="temporary" open={openDrawer} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}>
          {SideDrawerContent}
        </StyledDrawer>
      )}

      {/* 主要内容区域 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: isMobile ? 0 : '280px',
          mt: isMobile ? '56px' : '0',
          mb: isMobile ? '56px' : '0',
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
        }}
      >
        {!isMobile && <Toolbar />}
        <Routes>
          <Route path="/" element={<RoulettePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Box>
      
      {/* 移动端底部导航栏 */}
      {isMobile && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
          <BottomNavigation showLabels value={location.pathname}>
            <BottomNavigationAction label="轮盘" value="/" icon={<CasinoIcon />} onClick={() => navigate('/')} />
            <BottomNavigationAction label="设置" value="/settings" icon={<SettingsIcon />} onClick={() => navigate('/settings')} />
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
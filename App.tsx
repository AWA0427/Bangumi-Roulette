// src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from './contexts/AppContext';
import RoulettePage from './components/RoulettePage';
import SettingsPage from './components/SettingsPage';
import SideNav from './components/SideNav';
import BottomNav from './components/BottomNav';
import CallbackPage from './components/CallbackPage';
import { UserInfo, LogEntry, HistoryEntry, SnackbarState } from './types';

// 默认颜色设置
const DEFAULT_PRIMARY_COLOR = '#6750A4';
const DEFAULT_SECONDARY_COLOR = '#6A5F7B';

// OAUTH 配置（请确保这些值与您的 Bangumi 开发者中心设置一致）
const CLIENT_ID = 'bgm4227688cbad0a011f'; 
const OAUTH_AUTHORIZE_URL = 'https://bgm.tv/oauth/authorize';
const REDIRECT_URI = 'http://127.0.0.1:8000/callback'; 

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'roulette' | 'settings' | 'callback'>('roulette');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    const savedUser = localStorage.getItem('userInfo');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // 修正 1: 侧边栏折叠状态回归
  
  // Theme state: mode (暗色模式状态)
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light';
  });
  // ... (primaryColor, secondaryColor, nsfwEnabled, nsfwOnly, logs, history, snackbar state)

  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('primaryColor') || DEFAULT_PRIMARY_COLOR;
  });
  const [secondaryColor, setSecondaryColor] = useState<string>(() => {
    return localStorage.getItem('secondaryColor') || DEFAULT_SECONDARY_COLOR;
  });

  // NSFW state
  const [nsfwEnabled, setNsfwEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('nsfwEnabled');
    return saved ? saved === 'true' : false;
  });
  const [nsfwOnly, setNsfwOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem('nsfwOnly');
    return saved ? saved === 'true' : false;
  });
  
  // Log and History
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const savedLogs = localStorage.getItem('logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const savedHistory = localStorage.getItem('history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });


  // --- Utility Functions ---

  const addLog = useCallback((message: string, severity: LogEntry['severity'] = 'info') => {
    const newEntry: LogEntry = {
      timestamp: Date.now(),
      message,
      severity,
    };
    setLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newEntry];
      localStorage.setItem('logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  }, []);

  const addHistory = useCallback((entry: { item: HistoryEntry['item'] }) => {
    const newEntry: HistoryEntry = {
      timestamp: Date.now(),
      item: entry.item,
    };
    setHistory(prevHistory => {
      const updatedHistory = [...prevHistory, newEntry];
      localStorage.setItem('history', JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity']) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const login = useCallback(() => {
    addLog("UI操作: 触发 Bangumi 登录 (OAuth 重定向)");
    
    // 构造授权 URL
    const authUrl = `${OAUTH_AUTHORIZE_URL}?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    
    // 执行重定向，开始登录流程 (这会在 pywebview 窗口内导航)
    window.location.href = authUrl; 
  }, [addLog]);

  const logout = useCallback(() => {
    setAccessToken(null);
    setUserInfo(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
    showSnackbar('已安全退出登录。', 'info');
    addLog('用户操作: 已退出登录');
  }, [showSnackbar, addLog]);

  // Dark Mode toggle function
  const toggleMode = useCallback(() => {
    setMode(prevMode => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      addLog(`UI操作: 已切换到 ${newMode === 'dark' ? '暗色' : '亮色'} 模式`);
      return newMode;
    });
  }, [addLog]);
  
  // 修正 2: 侧边栏折叠切换函数
  const toggleSidebarCollapse = useCallback(() => {
    setIsCollapsed(prev => {
        const newState = !prev;
        addLog(`UI操作: 侧边栏已${newState ? '折叠' : '展开'}`);
        return newState;
    });
  }, [addLog]);


  // --- Side Effects ---
  
  // 注入全局登录成功处理函数，供 Python 后端调用
  useEffect(() => {
    const handleLoginSuccess = (accessToken: string, userInfo: UserInfo) => {
        setAccessToken(accessToken);
        setUserInfo(userInfo);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        showSnackbar(`登录成功！欢迎, ${userInfo.nickname || userInfo.username}`, 'success');
        addLog(`后台服务: 用户 ${userInfo.username} 登录成功。`);
        
        // 强制导航回轮盘页并清除 URL 参数
        setCurrentPage('roulette');
        // 清除 URL hash
        window.history.replaceState({}, document.title, window.location.pathname);
    };

    (window as any).handleLoginSuccess = handleLoginSuccess;

    return () => {
        delete (window as any).handleLoginSuccess;
    };
  }, [setAccessToken, setUserInfo, showSnackbar, addLog, setCurrentPage]);

  
  useEffect(() => {
    // 检查 URL hash 变化，用于处理授权回调和页面导航
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith('#/callback')) {
          setCurrentPage('callback');
      } else if (hash.startsWith('#/settings')) {
          setCurrentPage('settings');
      } else {
          setCurrentPage('roulette');
      }
    };
    
    // 首次加载时调用
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []); // 仅在挂载时运行

  useEffect(() => {
    // 处理主题颜色变化
    const root = document.documentElement;
    root.setAttribute('data-theme', mode); 
    
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
  }, [mode, primaryColor, secondaryColor]); 

  // --- Context Value ---

  const appContextValue = useMemo(() => ({
    currentPage, setCurrentPage,
    userInfo, setUserInfo,
    accessToken, setAccessToken,
    mode, toggleMode, 
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
    nsfwEnabled, setNsfwEnabled,
    nsfwOnly, setNsfwOnly,
    logs, setLogs,
    history, setHistory,
    showSnackbar,
    addLog,
    addHistory,
    login,
    logout,
  }), [
    currentPage, userInfo, accessToken, mode, toggleMode, primaryColor, secondaryColor, nsfwEnabled, nsfwOnly, 
    logs, history, showSnackbar, addLog, addHistory, login, logout
  ]);

  // --- Render Functions ---

  const renderContent = () => {
    // ... (content logic remains the same)

    switch (currentPage) {
      case 'roulette':
        return <RoulettePage />;
      case 'settings':
        return <SettingsPage />; // 确保设置页可以访问
      case 'callback':
        return <CallbackPage />;
      default:
        return <RoulettePage />;
    }
  };

  const sideNavWidthClass = isCollapsed ? 'md:ml-20' : 'md:ml-64'; // 侧边栏宽度
  
  return (
    <AppContext.Provider value={appContextValue}>
      <div className={`flex min-h-screen bg-bkg-default`}>
        <SideNav 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          isDrawerOpen={isDrawerOpen} 
          setDrawerOpen={setDrawerOpen} 
          isCollapsed={isCollapsed} 
          toggleSidebarCollapse={toggleSidebarCollapse} // 传递折叠函数
        />
        
        <main className={`flex-1 flex flex-col transition-all duration-300 ${sideNavWidthClass}`}>
          <header className="md:hidden flex items-center justify-between p-4 bg-bkg-paper shadow-md">
            <button onClick={() => setDrawerOpen(true)} className="text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl font-bold text-text-primary">Bangumi 轮盘</h1> {/* 移动端标题修正 */}
            <div className="w-6"></div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            {renderContent()}
          </div>
        </main>

        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {/* Snackbar Logic */}
        {snackbar.open && (
           <div className={`fixed bottom-5 right-5 z-50 rounded-lg p-4 text-white ${
            snackbar.severity === 'success' ? 'bg-green-500' :
            snackbar.severity === 'error' ? 'bg-red-500' :
            snackbar.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
           }`}>
             <div className="flex items-center">
              <span>{snackbar.message}</span>
              <button onClick={hideSnackbar} className="ml-4 p-1 rounded-full hover:bg-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
           </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
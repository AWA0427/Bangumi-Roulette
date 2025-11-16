import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from './contexts/AppContext';
import RoulettePage from './components/RoulettePage';
import SettingsPage from './components/SettingsPage';
import SideNav from './components/SideNav';
import BottomNav from './components/BottomNav';
import CallbackPage from './components/CallbackPage';
import { UserInfo, LogEntry, HistoryEntry, SnackbarState } from './types';

const DEFAULT_PRIMARY_COLOR = '#6750A4';
const DEFAULT_SECONDARY_COLOR = '#6A5F7B';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'roulette' | 'settings'>('roulette');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    const savedUser = localStorage.getItem('userInfo');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  
  // Theme state
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light';
  });
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('primaryColor') || DEFAULT_PRIMARY_COLOR;
  });
  const [secondaryColor, setSecondaryColor] = useState<string>(() => {
    return localStorage.getItem('secondaryColor') || DEFAULT_SECONDARY_COLOR;
  });

  // Settings state
  const [nsfwEnabled, setNsfwEnabled] = useState<boolean>(() => {
    return localStorage.getItem('nsfwEnabled') === 'true';
  });
  const [nsfwOnly, setNsfwOnly] = useState<boolean>(() => {
    return localStorage.getItem('nsfwOnly') === 'true';
  });

  // Data management state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // UI State
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'info' });

  // Save user info and token to localStorage
  useEffect(() => {
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      localStorage.removeItem('userInfo');
    }
  }, [userInfo]);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [accessToken]);


  // Apply theme colors via CSS variables
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-secondary', secondaryColor);
    
    if (mode === 'dark') {
      root.style.setProperty('--color-bkg-default', '#121212');
      root.style.setProperty('--color-bkg-paper', '#1D1D1D');
      root.style.setProperty('--color-text-primary', '#E6E1E5');
      root.style.setProperty('--color-text-secondary', '#CAC4D0');
      document.body.classList.add('dark');
    } else {
      root.style.setProperty('--color-bkg-default', '#f7f7f8');
      root.style.setProperty('--color-bkg-paper', '#ffffff');
      root.style.setProperty('--color-text-primary', '#1D1B20');
      root.style.setProperty('--color-text-secondary', '#49454F');
      document.body.classList.remove('dark');
    }

    localStorage.setItem('themeMode', mode);
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('secondaryColor', secondaryColor);
  }, [mode, primaryColor, secondaryColor]);

  useEffect(() => {
    localStorage.setItem('nsfwEnabled', String(nsfwEnabled));
  }, [nsfwEnabled]);

  useEffect(() => {
    localStorage.setItem('nsfwOnly', String(nsfwOnly));
  }, [nsfwOnly]);


  const addLog = useCallback((message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      message,
    };
    setLogs(prev => [...prev, newLog]);
  }, []);

  const addHistory = useCallback((entry: Omit<HistoryEntry, 'timestamp'>) => {
    const newHistoryEntry: HistoryEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };
    setHistory(prev => [newHistoryEntry, ...prev]);
  }, []);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const handleResetAllSettings = useCallback(() => {
    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setSecondaryColor(DEFAULT_SECONDARY_COLOR);
    setNsfwEnabled(false);
    setNsfwOnly(false);
    addLog("重置所有设置为默认值。");
    showSnackbar("所有设置已重置。", "success");
  }, [addLog, showSnackbar]);

  const appContextValue = useMemo(() => ({
    userInfo,
    setUserInfo,
    accessToken,
    setAccessToken,
    nsfwEnabled,
    setNsfwEnabled,
    nsfwOnly,
    setNsfwOnly,
    logs,
    addLog,
    setLogs,
    history,
    addHistory,
    setHistory,
    showSnackbar
  }), [userInfo, accessToken, nsfwEnabled, nsfwOnly, logs, history, addLog, addHistory, showSnackbar]);

  const renderContent = () => {
    switch (currentPage) {
      case 'roulette':
        return <RoulettePage />;
      case 'settings':
        return <SettingsPage 
                  setPrimaryColor={setPrimaryColor} 
                  setSecondaryColor={setSecondaryColor} 
                  primaryColor={primaryColor} 
                  secondaryColor={secondaryColor} 
                  onResetAllSettings={handleResetAllSettings}
                />;
      default:
        return <RoulettePage />;
    }
  };

  const renderPage = () => {
    const path = window.location.pathname;

    if (path.startsWith('/callback')) {
      return <CallbackPage />;
    }

    return (
       <div className="flex h-screen bg-bkg-default text-text-primary">
        <SideNav 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          mode={mode}
          setMode={setMode}
          isOpen={isDrawerOpen}
          setIsOpen={setDrawerOpen}
        />
        
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header for mobile */}
          <header className="md:hidden flex items-center justify-between p-4 bg-bkg-paper shadow-md">
            <button onClick={() => setDrawerOpen(true)} className="text-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-xl font-bold text-text-primary">Bangumi 轮盘</h1>
            <div className="w-6"></div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            {renderContent()}
          </div>
        </main>

        <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

        {snackbar.open && (
           <div className={`fixed bottom-5 right-5 z-50 rounded-lg p-4 text-white ${
            snackbar.severity === 'success' ? 'bg-green-500' :
            snackbar.severity === 'error' ? 'bg-red-500' :
            snackbar.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
           }`}>
             <div className="flex items-center">
              <span>{snackbar.message}</span>
              <button onClick={handleSnackbarClose} className="ml-4 font-bold">X</button>
             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <AppContext.Provider value={appContextValue}>
      {renderPage()}
    </AppContext.Provider>
  );
};

export default App;
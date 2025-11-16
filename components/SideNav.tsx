import React, { useContext, Dispatch, SetStateAction } from 'react';
import { AppContext } from '../contexts/AppContext';
import { redirectToAuth } from '../services/authService';

interface SideNavProps {
  currentPage: 'roulette' | 'settings';
  setCurrentPage: (page: 'roulette' | 'settings') => void;
  mode: 'light' | 'dark';
  setMode: Dispatch<SetStateAction<'light' | 'dark'>>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const NavLink: React.FC<{
  icon: React.ReactElement;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full text-left px-4 py-3 my-1 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary text-white'
        : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
    }`}
  >
    <span className="mr-3">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const SideNavContent: React.FC<Omit<SideNavProps, 'isOpen' | 'setIsOpen'>> = ({ currentPage, setCurrentPage, mode, setMode }) => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found");
  
  const { userInfo, setUserInfo, setAccessToken, showSnackbar, addLog } = context;

  const handleLogin = () => {
    addLog("开始登录流程...");
    redirectToAuth();
  };
  
  const handleLogout = () => {
    addLog(`用户 ${userInfo?.nickname} 已登出。`);
    setUserInfo(null);
    setAccessToken(null);
    showSnackbar('您已登出。', 'info');
  };

  return (
    <div className="h-full flex flex-col p-4 bg-bkg-paper">
      <div className="flex items-center gap-3 p-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary flex-shrink-0 overflow-hidden">
           {userInfo && userInfo.avatarUrl ? (
             <img src={userInfo.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full bg-secondary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
          )}
        </div>
        <div>
          <p className="font-bold text-lg text-text-primary">{userInfo?.nickname || '未登录'}</p>
          {!userInfo && <p className="text-sm text-text-secondary">请登录以使用轮盘</p>}
        </div>
      </div>
      
      <nav className="flex-grow">
        <NavLink 
          label="轮盘"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v1.586M12 16.16v1.586M16.16 12h1.586M6.253 12H7.84m10.916-5.656l-1.121 1.121M7.778 16.222l-1.121 1.121M17.344 16.222l-1.121-1.121M6.657 7.778l1.121-1.121M12 12a2 2 0 100-4 2 2 0 000 4z" /></svg>}
          isActive={currentPage === 'roulette'}
          onClick={() => setCurrentPage('roulette')}
        />
        <NavLink 
          label="设置"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          isActive={currentPage === 'settings'}
          onClick={() => setCurrentPage('settings')}
        />
        <NavLink
            label={mode === 'dark' ? '亮色模式' : '暗色模式'}
            icon={mode === 'dark' ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
            isActive={false}
            onClick={() => setMode(prev => prev === 'dark' ? 'light' : 'dark')}
        />
      </nav>

      <div className="mt-auto">
        {userInfo ? (
          <button onClick={handleLogout} className="w-full bg-red-500/80 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition">登出</button>
        ) : (
          <button onClick={handleLogin} className="w-full bg-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">登录</button>
        )}
      </div>
    </div>
  );
};


const SideNav: React.FC<SideNavProps> = ({ currentPage, setCurrentPage, mode, setMode, isOpen, setIsOpen }) => {
  const content = <SideNavContent currentPage={currentPage} setCurrentPage={setCurrentPage} mode={mode} setMode={setMode} />;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 shadow-lg">
        {content}
      </aside>

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'bg-black bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`} onClick={() => setIsOpen(false)}></div>
      <aside className={`md:hidden fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {content}
      </aside>
    </>
  );
};

export default SideNav;

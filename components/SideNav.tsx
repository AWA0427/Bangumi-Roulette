// src/components/SideNav.tsx
import React, { useContext, useState } from 'react'; 
import { AppContext } from '../contexts/AppContext';

// 导航项组件 (样式保留为朴素模式)
const NavItem: React.FC<{
  label: string;
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean; 
}> = ({ label, icon, isActive, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-primary/20 text-primary font-semibold' // 提升活动状态的可见性
        : 'text-text-secondary hover:bg-bkg-default' 
    }`}
    title={isCollapsed ? label : undefined}
  >
    {/* 确保图标颜色跟随文字 */}
    {React.cloneElement(icon, { className: `h-6 w-6 mr-3 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-secondary'}` })}
    <span className={`font-medium transition-opacity duration-200 ${isCollapsed ? 'opacity-0 absolute' : 'opacity-100'}`}>{label}</span>
  </button>
);

interface SideNavProps {
  currentPage: 'roulette' | 'settings' | 'callback';
  setCurrentPage: (page: 'roulette' | 'settings' | 'callback') => void;
  isDrawerOpen: boolean;
  setDrawerOpen: (isOpen: boolean) => void;
  isCollapsed: boolean; 
  toggleSidebarCollapse: () => void; // 修正 1: 侧边栏折叠切换函数
}

const SideNav: React.FC<SideNavProps> = ({ currentPage, setCurrentPage, isDrawerOpen, setDrawerOpen, isCollapsed, toggleSidebarCollapse }) => {
  const context = useContext(AppContext);
  if (!context) return null;

  const { userInfo, login, logout, mode } = context;

  const navClasses = `
    hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-bkg-paper shadow-lg 
    transition-all duration-300 h-screen overflow-y-auto p-4 flex-shrink-0
    ${isCollapsed ? 'w-20' : 'w-64'}
  `;

  const drawerClasses = `
    fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out
    ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
    md:hidden
  `;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className={navClasses}>
        
        {/* 修正 2 & 3: Logo/Title & Collapse Button */}
        <div className={`flex items-center justify-between py-4 ${isCollapsed ? 'px-0' : 'px-4'}`}>
            <h1 className={`text-xl font-bold text-primary transition-opacity duration-200 ${isCollapsed ? 'opacity-0 absolute' : 'opacity-100'}`}>
                Bangumi Roulette 
            </h1>
            <h1 className={`text-xl font-bold text-primary transition-opacity duration-200 ${isCollapsed ? 'opacity-100' : 'opacity-0 absolute'}`}>
                B-R
            </h1>
            
            {/* Collapse Toggle Button */}
            <button
                onClick={toggleSidebarCollapse}
                className={`p-1 rounded-full text-text-secondary hover:bg-bkg-default/70 transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
                title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
                {/* Icon based on isCollapsed */}
                {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0a9 9 0 01-18 0z" /></svg>
                )}
            </button>
        </div>
          
        <div className="flex-1 space-y-2">
          {/* 导航项 */}
          <NavItem
            label="轮盘"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v1.586m0 10.322v1.586M16.16 12h1.586M6.253 12H7.84m10.916-5.656l-1.121 1.121M7.778 16.222l-1.121 1.121M17.344 16.222l-1.121-1.121M6.657 7.778l1.121-1.121M12 12a2 2 0 100-4 2 2 0 000 4z" /></svg>}
            isActive={currentPage === 'roulette'}
            onClick={() => setCurrentPage('roulette')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            label="设置"
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            isActive={currentPage === 'settings'}
            onClick={() => setCurrentPage('settings')}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* User Info / Login / Logout */}
        <div className="mt-auto pt-4 border-t border-bkg-default/50">
          {userInfo ? (
            <div className={`space-y-2 ${isCollapsed ? 'text-center' : ''}`}>
                {/* 修正 4: 确保用户头像可见 */}
                <div className={`flex items-center space-x-3 transition-opacity duration-200 ${isCollapsed ? 'justify-center space-x-0' : 'justify-start'}`}>
                  <img 
                    src={userInfo.avatar_url || 'https://bgm.tv/img/no_icon_user.png'} 
                    alt={userInfo.username} 
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <span className={`text-sm font-medium text-text-primary truncate transition-opacity duration-200 ${isCollapsed ? 'hidden' : 'block'}`} title={userInfo.nickname || userInfo.username}>
                    {userInfo.nickname || userInfo.username}
                  </span>
                </div>
                {/* Logout Button */}
                <button 
                  onClick={logout}
                  className={`w-full py-2 text-sm font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all duration-200 ${isCollapsed ? 'px-0' : 'px-4'}`}
                  title={isCollapsed ? '退出登录' : undefined}
                >
                  {isCollapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  ) : (
                    '退出登录'
                  )}
                </button>
            </div>
          ) : (
            <button 
              onClick={login}
              className={`w-full py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white transition-all duration-200 ${isCollapsed ? 'px-0 text-xs' : 'px-4'}`}
              title={isCollapsed ? '登录' : undefined}
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              ) : (
                '登录 Bangumi'
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Drawer (Overlay) - 保持与之前逻辑一致 */}
      <div 
        className={drawerClasses}
        style={{ backgroundColor: isDrawerOpen ? (mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)') : 'transparent', pointerEvents: isDrawerOpen ? 'auto' : 'none' }}
        onClick={() => setDrawerOpen(false)}
      >
        <nav 
          className={`flex flex-col h-full w-64 bg-bkg-paper p-4 transition-transform duration-300 ease-in-out`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the drawer
        >
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-bkg-default/50">
            <h1 className="text-xl font-bold text-primary">Bangumi Roulette</h1> {/* 移动端标题修正 */}
            <button onClick={() => setDrawerOpen(false)} className="text-text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          {/* Mobile Nav Items */}
          <div className="flex-1 space-y-2">
            <NavItem
                label="轮盘"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v1.586m0 10.322v1.586M16.16 12h1.586M6.253 12H7.84m10.916-5.656l-1.121 1.121M7.778 16.222l-1.121 1.121M17.344 16.222l-1.121-1.121M6.657 7.778l1.121-1.121M12 12a2 2 0 100-4 2 2 0 000 4z" /></svg>}
                isActive={currentPage === 'roulette'}
                onClick={() => { setCurrentPage('roulette'); setDrawerOpen(false); }}
                isCollapsed={false}
            />
            <NavItem
                label="设置"
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                isActive={currentPage === 'settings'}
                onClick={() => { setCurrentPage('settings'); setDrawerOpen(false); }}
                isCollapsed={false}
            />
          </div>
          
          {/* Mobile User Info / Login / Logout */}
          <div className="mt-auto pt-4 border-t border-bkg-default/50">
            {userInfo ? (
                <div className='space-y-2'>
                    {/* User Avatar and Name */}
                    <div className='flex items-center space-x-3'>
                        <img 
                            src={userInfo.avatar_url || 'https://bgm.tv/img/no_icon_user.png'} 
                            alt={userInfo.username} 
                            className="w-10 h-10 rounded-full flex-shrink-0"
                        />
                        <span className='text-sm font-medium text-text-primary truncate'>
                            {userInfo.nickname || userInfo.username}
                        </span>
                    </div>
                    {/* Logout Button */}
                    <button 
                        onClick={logout}
                        className='w-full py-2 text-sm font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all duration-200 px-4'
                    >
                        退出登录
                    </button>
                </div>
            ) : (
                <button 
                    onClick={() => { login(); setDrawerOpen(false); }}
                    className='w-full py-2 text-sm font-semibold rounded-lg bg-primary hover:bg-primary/90 text-white transition-all duration-200 px-4'
                >
                    登录 Bangumi
                </button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default SideNav;
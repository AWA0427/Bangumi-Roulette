// src/components/CallbackPage.tsx
import React, { useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

const CallbackPage: React.FC = () => {
    const context = useContext(AppContext);

    useEffect(() => {
        if (!context) return;
        const { accessToken, addLog, showSnackbar, setCurrentPage } = context;

        // 如果已经登录，强制跳转
        if (accessToken) {
            setCurrentPage('roulette');
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');

        if (error) {
            const errorMessage = `授权失败: ${error}。请返回主页重试。`;
            addLog(errorMessage, 'error');
            showSnackbar("授权未完成。请返回主页重试。", 'error'); 
            setCurrentPage('roulette');
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        const code = params.get('code');
        if (code) {
             // 成功获取到 code，通知后端处理。后端会调用 window.handleLoginSuccess
            addLog(`前端已收到授权码: ${code.substring(0, 8)}...，等待 pywebview 后端处理。`, 'info');
        } else {
             // 既没有 code 也没有 error，直接返回主页
             addLog("Callback URL 无效参数，返回主页。", 'warning');
             setCurrentPage('roulette');
             window.history.replaceState({}, document.title, window.location.pathname);
             return;
        }
        
        // 如果 10 秒后还没有登录成功，强制返回主页并提示错误
        const timeoutId = setTimeout(() => {
            if (context.accessToken === null) {
                context.addLog("授权回调超时，强制返回主页。", 'error');
                context.showSnackbar("登录处理超时，请重试。", 'error');
                context.setCurrentPage('roulette');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }, 10000); // 10秒超时

        return () => {
            clearTimeout(timeoutId);
        };
        
    }, [context]);

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-bkg-default text-text-primary p-8">
            <div className="flex items-center text-2xl font-semibold text-primary">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>正在处理授权信息...</span>
            </div>
            <p className="mt-4 text-text-secondary">请稍候，我们正在安全地交换访问令牌并获取您的用户信息。</p>
            <p className="mt-2 text-xs text-text-secondary">处理成功后，应用将自动跳转。</p>
        </div>
    );
};

export default CallbackPage;
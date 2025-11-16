import React, { useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { exchangeCodeForToken, getUserInfo } from '../services/authService';

const CallbackPage: React.FC = () => {
    const context = useContext(AppContext);

    useEffect(() => {
        const handleAuth = async () => {
            if (!context) return;
            const { setAccessToken, setUserInfo, showSnackbar, addLog } = context;

            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');

            if (code) {
                try {
                    addLog("授权码已收到，正在交换访问令牌...");
                    const token = await exchangeCodeForToken(code);
                    setAccessToken(token);
                    addLog("访问令牌交换成功。");

                    addLog("正在获取用户信息...");
                    const userInfo = await getUserInfo(token);
                    setUserInfo(userInfo);
                    addLog(`用户信息获取成功: ${userInfo.username}`);
                    
                    showSnackbar(`登录成功！欢迎, ${userInfo.nickname}`, 'success');

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "发生未知登录错误。";
                    addLog(`登录流程失败: ${errorMessage}`);
                    showSnackbar(errorMessage, 'error');
                } finally {
                    window.history.replaceState({}, document.title, "/");
                    window.location.replace('/');
                }
            } else {
                const error = params.get('error');
                if (error) {
                    const errorMessage = `授权失败: ${error}`;
                    addLog(errorMessage);
                    showSnackbar(errorMessage, 'error');
                    window.history.replaceState({}, document.title, "/");
                    window.location.replace('/');
                }
            }
        };

        handleAuth();
    }, [context]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-bkg-default text-text-primary">
            <div className="flex items-center text-2xl font-semibold">
                <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在登录中，请稍候...
            </div>
            <p className="mt-4 text-text-secondary">正在完成 Bangumi 授权流程。</p>
        </div>
    );
};

export default CallbackPage;

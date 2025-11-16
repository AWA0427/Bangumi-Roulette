import { UserInfo } from '../types';

const CLIENT_ID = 'bgm4227688cbad0a011f'; 
// WARNING: The CLIENT_SECRET should NOT be exposed in a client-side application.
// This flow requires a backend proxy to securely exchange the code for a token.
const CLIENT_SECRET = '80c70b9f72838f50d626884231f43b05';
const REDIRECT_URI = window.location.origin + '/callback';

const OAUTH_AUTHORIZE_URL = "https://bgm.tv/oauth/authorize";
const OAUTH_TOKEN_URL = "https://bgm.tv/oauth/access_token";
const API_BASE_URL = "https://api.bgm.tv/v0";

export const redirectToAuth = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
  });
  window.location.href = `${OAUTH_AUTHORIZE_URL}?${params.toString()}`;
};

export const exchangeCodeForToken = async (code: string): Promise<string> => {
    const payload = {
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
    };

    const response = await fetch(OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Bangumi-Roulette-Web (https://github.com/AWA0427/Bangumi-Roulette)',
        },
        body: new URLSearchParams(payload),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`无法交换授权码: ${errorData.error_description || response.statusText}`);
    }

    const tokenData = await response.json();
    if (!tokenData.access_token) {
        throw new Error('未能从响应中获取 Access Token。');
    }
    return tokenData.access_token;
};


export const getUserInfo = async (accessToken: string): Promise<UserInfo> => {
    const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Bangumi-Roulette-Web (https://github.com/AWA0427/Bangumi-Roulette)',
        },
    });

    if (!response.ok) {
        throw new Error(`无法获取用户信息 (状态: ${response.status})。`);
    }

    const data = await response.json();
    
    return {
        id: data.id,
        username: data.username,
        nickname: data.nickname,
        avatarUrl: data.avatar?.large || `https://lain.bgm.tv/pic/user/l/000/00/00/1.jpg`,
    };
};

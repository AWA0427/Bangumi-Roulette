import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    Paper, 
    CircularProgress, 
    Stack, 
    Card, 
    CardContent, 
    CardMedia, 
    CardActions 
} from '@mui/material';

function RoulettePage() {
    const [isLoading, setIsLoading] = useState(false);
    const [rouletteItem, setRouletteItem] = useState(null);
    const [userInfo, setUserInfo] = useState(null);

    // 检查登录状态
    useEffect(() => {
        if (window.pywebview && window.pywebview.api.get_user_info) {
            window.pywebview.api.get_user_info().then(response => {
                if (response.success) {
                    setUserInfo(response.user_data);
                }
            });
        }
    }, []);

    const handleLoginClick = () => {
        if (window.pywebview && window.pywebview.api.start_login_flow) {
            window.pywebview.api.start_login_flow();
        } else {
            window.showSnackbar('error', 'Pywebview API 或 start_login_flow 方法不可用');
        }
    };

    const handleSpinClick = async () => {
        if (!userInfo) {
            window.showSnackbar('warning', '请先登录以使用轮盘功能');
            return;
        }

        setIsLoading(true);
        setRouletteItem(null);
        
        // 模拟 API 延迟
        setTimeout(() => {
            setRouletteItem({
                name_cn: "模拟随机番剧",
                name: "Simulated Random Anime",
                image: "https://lain.bgm.tv/pic/cover/l/7f/7a/100078_l466L.jpg",
                summary: "这是一个模拟的番剧简介。在这里会显示从您的收藏中随机抽取的一个番剧的详细信息。",
            });
            setIsLoading(false);
        }, 2000);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4 }}>轮盘页面</Typography>

            {/* 登录提示，仅在未登录时显示 */}
            {!userInfo && (
                <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>登录功能</Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>请登录以使用轮盘功能，系统将从您的收藏中随机抽取番剧。</Typography>
                    <Button variant="contained" onClick={handleLoginClick}>
                        登录
                    </Button>
                </Paper>
            )}

            {/* 轮盘主界面 */}
            <Paper sx={{ p: 3, mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" gutterBottom>开始轮盘</Typography>
                <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>点击下方按钮，从您的收藏中随机抽取一个未看过的番剧。</Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSpinClick}
                    disabled={isLoading || !userInfo}
                    sx={{ mt: 2 }}
                >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : "开始"}
                </Button>
            </Paper>

            {/* 随机结果展示区域 */}
            {rouletteItem && (
                <Card sx={{ maxWidth: 600, mx: 'auto' }}>
                    <CardMedia
                        component="img"
                        height="200"
                        image={rouletteItem.image}
                        alt={rouletteItem.name_cn || rouletteItem.name}
                        sx={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            {rouletteItem.name_cn || rouletteItem.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {rouletteItem.summary}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button size="small">在 Bangumi 上查看</Button>
                        <Button size="small" onClick={handleSpinClick}>再来一次</Button>
                    </CardActions>
                </Card>
            )}
        </Box>
    );
}

export default RoulettePage;

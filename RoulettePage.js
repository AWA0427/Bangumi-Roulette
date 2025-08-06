import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { GlobalContext } from '../App';

export function RoulettePage({ user, collections }) {
  const { showSnackbar } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(1); // 默认为 "想看"
  const [dialogOpen, setDialogOpen] = useState(false);
  const [luckyItem, setLuckyItem] = useState(null);

  const handleGetCollections = async () => {
    if (!user) {
      showSnackbar('warning', '请先登录！');
      return;
    }
    setLoading(true);
    try {
      // 调用 Python 后端获取所有收藏
      const result = await pywebview.api.get_all_collections_and_notify_ui();
      if (!result.success) {
        showSnackbar('error', '获取收藏列表失败。');
      }
    } catch (e) {
      showSnackbar('error', `获取失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSpinRoulette = async () => {
    if (!collections || !collections[selectedStatus] || collections[selectedStatus].length === 0) {
      showSnackbar('warning', '当前列表没有项目，请先获取收藏列表。');
      return;
    }
    
    try {
      const result = await pywebview.api.get_random_item(selectedStatus);
      if (result.success) {
        setLuckyItem(result.item);
        setDialogOpen(true);
      } else {
        showSnackbar('error', result.error);
      }
    } catch (e) {
      showSnackbar('error', `抽签失败: ${e.message}`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Bangumi 轮盘</Typography>
      
      <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button 
          variant="contained" 
          onClick={handleGetCollections} 
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : '获取收藏列表'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="collection-status-label">收藏状态</InputLabel>
          <Select
            labelId="collection-status-label"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            label="收藏状态"
          >
            <MenuItem value={1}>想看</MenuItem>
            <MenuItem value={2}>看过</MenuItem>
            <MenuItem value={3}>在看</MenuItem>
            <MenuItem value={4}>搁置</MenuItem>
            <MenuItem value={5}>抛弃</MenuItem>
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSpinRoulette}
          disabled={!collections}
        >
          开始抽签
        </Button>
      </Box>
      
      {/* 抽签结果弹窗 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>抽签结果</DialogTitle>
        <DialogContent>
          {luckyItem && (
            <Box>
              <Typography variant="h6">{luckyItem.subject.name_cn || luckyItem.subject.name}</Typography>
              <img src={luckyItem.subject.images.large} alt={luckyItem.subject.name} style={{ width: '100%', borderRadius: 8, marginTop: 16 }} />
              {/* 这里可以展示更多项目信息 */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

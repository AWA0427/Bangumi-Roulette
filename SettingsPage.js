import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Switch,
  IconButton,
} from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import HistoryIcon from '@mui/icons-material/History';
import CloseIcon from '@mui/icons-material/Close';

function SettingsPage() {
  const [logs, setLogs] = useState([]);
  const [isLogDialogOpen, setLogDialogOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryDialogOpen, setHistoryDialogOpen] = useState(false);
  const [nsfwEnabled, setNsfwEnabled] = useState(false);
  const [nsfwOnly, setNsfwOnly] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (window.pywebview) {
        if (window.pywebview.api.get_nsfw_status) {
          const nsfwResponse = await window.pywebview.api.get_nsfw_status();
          if (nsfwResponse.success) {
            setNsfwEnabled(nsfwResponse.nsfw_enabled);
          }
        }
        if (window.pywebview.api.get_nsfw_only_status) {
          const nsfwOnlyResponse = await window.pywebview.api.get_nsfw_only_status();
          if (nsfwOnlyResponse.success) {
            setNsfwOnly(nsfwOnlyResponse.nsfw_only);
          }
        }
      }
    };
    fetchSettings();
  }, []);

  // --- 日志功能 ---
  const handleOpenLogDialog = async () => {
    if (window.pywebview && window.pywebview.api.get_logs) {
      const response = await window.pywebview.api.get_logs();
      if (response.success) {
        setLogs(response.logs);
        setLogDialogOpen(true);
      }
    }
  };
  const handleExportLog = async () => {
    if (window.pywebview && window.pywebview.api.export_log) {
      const response = await window.pywebview.api.export_log();
      if (response.success) {
        window.showSnackbar('success', `日志已导出到: ${response.path}`);
      } else {
        window.showSnackbar('error', `导出日志失败: ${response.error}`);
      }
    }
  };
  const handleClearLog = async () => {
    if (window.pywebview && window.pywebview.api.clear_log) {
      const response = await window.pywebview.api.clear_log();
      if (response.success) {
        setLogs([]);
        window.showSnackbar('success', '日志已清除');
      }
    }
  };
  
  // --- 历史记录功能 ---
  const handleOpenHistoryDialog = async () => {
    if (window.pywebview && window.pywebview.api.get_history) {
      const response = await window.pywebview.api.get_history();
      if (response.success) {
        setHistory(response.history);
        setHistoryDialogOpen(true);
      }
    }
  };
  const handleExportHistory = async () => {
    if (window.pywebview && window.pywebview.api.export_history) {
      const response = await window.pywebview.api.export_history();
      if (response.success) {
        window.showSnackbar('success', `历史记录已导出到: ${response.path}`);
      } else {
        window.showSnackbar('error', `导出历史记录失败: ${response.error}`);
      }
    }
  };
  const handleClearHistory = async () => {
    if (window.pywebview && window.pywebview.api.clear_history) {
      const response = await window.pywebview.api.clear_history();
      if (response.success) {
        setHistory([]);
        window.showSnackbar('success', '历史记录已清除');
      }
    }
  };
  
  // --- 设置功能 ---
  const handleNsfwToggle = async () => {
    const newStatus = !nsfwEnabled;
    if (window.pywebview && window.pywebview.api.set_nsfw_status) {
      const response = await window.pywebview.api.set_nsfw_status(newStatus);
      if (response.success) {
        setNsfwEnabled(newStatus);
        window.showSnackbar('success', `成人内容显示已${newStatus ? '开启' : '关闭'}`);
      } else {
        window.showSnackbar('error', '更新设置失败');
      }
    }
  };

  const handleNsfwOnlyToggle = async () => {
    const newStatus = !nsfwOnly;
    if (window.pywebview && window.pywebview.api.set_nsfw_only_status) {
      const response = await window.pywebview.api.set_nsfw_only_status(newStatus);
      if (response.success) {
        setNsfwOnly(newStatus);
        window.showSnackbar('success', `仅显示成人内容已${newStatus ? '开启' : '关闭'}`);
      } else {
        window.showSnackbar('error', '更新设置失败');
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>设置页面</Typography>
      <Paper elevation={0} sx={{ p: 2 }}>
        <List>
          <ListItemButton>
            <ListItemText primary="显示成人内容" />
            <Switch edge="end" checked={nsfwEnabled} onChange={handleNsfwToggle} />
          </ListItemButton>
          <ListItemButton>
            <ListItemText primary="仅显示成人内容" />
            <Switch edge="end" checked={nsfwOnly} onChange={handleNsfwOnlyToggle} />
          </ListItemButton>
          <Divider sx={{ my: 1 }} />
          <ListItemButton onClick={handleOpenLogDialog}>
            <ListItemIcon><ArticleIcon /></ListItemIcon>
            <ListItemText primary="应用日志" />
          </ListItemButton>
          <ListItemButton onClick={handleOpenHistoryDialog}>
            <ListItemIcon><HistoryIcon /></ListItemIcon>
            <ListItemText primary="历史记录" />
          </ListItemButton>
        </List>
      </Paper>

      {/* 日志悬浮窗 */}
      <Dialog open={isLogDialogOpen} onClose={() => setLogDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          应用日志
          <IconButton onClick={() => setLogDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxHeight: '500px', overflowY: 'auto' }}>
            {logs.map((log, index) => <Typography key={index} variant="body2">{log}</Typography>)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearLog}>清除日志</Button>
          <Button onClick={handleExportLog}>导出日志</Button>
        </DialogActions>
      </Dialog>
      
      {/* 历史记录悬浮窗 */}
      <Dialog open={isHistoryDialogOpen} onClose={() => setHistoryDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          历史记录
          <IconButton onClick={() => setHistoryDialogOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
            {history.length > 0 ? (
              history.map((item, index) => (
                <Paper key={index} sx={{ p: 2, mb: 1 }}>
                  <Typography variant="body1">时间: {new Date(item.timestamp).toLocaleString()}</Typography>
                  <Typography variant="body2">名称: {item.item.name_cn || item.item.name}</Typography>
                </Paper>
              ))
            ) : (
              <Typography>暂无历史记录</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClearHistory}>清除记录</Button>
          <Button onClick={handleExportHistory}>导出记录</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SettingsPage;

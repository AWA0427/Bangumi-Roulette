// src/components/RoulettePage.tsx
import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { RouletteItem, CATEGORIES, STATUSES } from '../types';
import { getRouletteItem } from '../services/bangumiService';

// 辅助函数：将数据导出为 JSON 文件，使用 yyyymmddhhmmss 格式
const downloadJson = (data: any, prefix: string) => {
    const now = new Date();
    const formatNumber = (num: number) => num.toString().padStart(2, '0');
    const timestamp = `${
        now.getFullYear()}${
        formatNumber(now.getMonth() + 1)}${
        formatNumber(now.getDate())}${
        formatNumber(now.getHours())}${
        formatNumber(now.getMinutes())}${
        formatNumber(now.getSeconds())}`;
        
    const filename = `${prefix}${timestamp}.json`;
        
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const RoulettePage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found");
  
  const { 
    userInfo, accessToken, showSnackbar, addHistory, addLog, 
    logs, history // 引入 logs 和 history
  } = context;

  const [isLoading, setIsLoading] = useState(false);
  const [rouletteItem, setRouletteItem] = useState<RouletteItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('anime');
  const [selectedStatus, setSelectedStatus] = useState('want_to_watch');

  const getLabelByValue = (value: string, list: { value: string; label: string }[]) => {
    return list.find(i => i.value === value)?.label || value;
  };

  const handleSpinClick = async () => {
    if (!userInfo || !accessToken) {
      showSnackbar('请先登录才能使用轮盘。', 'warning');
      return;
    }
    
    addLog(`Spinning roulette with category: ${selectedCategory}, status: ${selectedStatus}`);
    setIsLoading(true);
    setRouletteItem(null);
    
    try {
      // 假设 getRouletteItem 已经实现
      const item = await getRouletteItem(userInfo.username, selectedCategory, selectedStatus, accessToken);
      setRouletteItem(item);
      addHistory({ item });
      showSnackbar('成功找到了一个项目！', 'success');
      addLog(`Roulette结果: 抽中 ${item.name_cn || item.name}`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "获取项目失败，请检查网络或登录状态。";
      showSnackbar(errorMessage, 'error');
      addLog(`Roulette结果: 抽取失败: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 导出功能实现
  const exportLogs = () => {
      downloadJson(logs, "bangumi_roulette_logs_");
      showSnackbar('应用日志已导出。', 'success');
      addLog('UI操作: 导出应用日志。');
  };
  
  const exportHistory = () => {
      downloadJson(history, "bangumi_roulette_history_");
      showSnackbar('轮盘历史已导出。', 'success');
      addLog('UI操作: 导出轮盘历史。');
  };


  // 历史记录渲染组件
  const HistoryList: React.FC = () => (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-text-primary">抽取历史 ({history.length} 条)</h3>
        {/* 导出按钮在这里出现 */}
        <button
            onClick={exportHistory}
            className="text-primary hover:opacity-80 transition text-sm font-medium"
        >
            导出 JSON
        </button>
      </div>
      <div className="h-40 overflow-y-auto bg-bkg-paper p-3 rounded-lg border border-bkg-default">
        {history.length === 0 ? (
          <p className="text-text-secondary italic text-sm">暂无历史记录。</p>
        ) : (
          <ul className="space-y-2">
            {history.slice(0, 10).map((entry, index) => (
              <li key={index} className="text-sm border-b border-bkg-default/30 pb-1">
                <span className="font-medium text-text-primary">{entry.item.name_cn || entry.item.name}</span>
                <span className="text-xs text-text-secondary ml-2">({new Date(entry.timestamp).toLocaleTimeString()})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
  
  // 日志渲染组件
  const LogList: React.FC = () => (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-text-primary">点滴日志 ({logs.length} 条)</h3>
        {/* 导出按钮在这里出现 */}
        <button
            onClick={exportLogs}
            className="text-primary hover:opacity-80 transition text-sm font-medium"
        >
            导出 JSON
        </button>
      </div>
      <div className="h-40 overflow-y-auto bg-bkg-paper p-3 rounded-lg border border-bkg-default">
        {logs.length === 0 ? (
          <p className="text-text-secondary italic text-sm">暂无日志。</p>
        ) : (
          <ul className="space-y-1">
            {logs.slice(0, 10).map((log, index) => (
              <li key={index} className={`text-xs ${log.severity === 'error' ? 'text-red-500' : log.severity === 'warning' ? 'text-yellow-600' : 'text-text-primary'}`}>
                <span className="font-mono text-xs text-text-secondary mr-1">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                {log.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );


  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-text-primary mb-6">我的收藏轮盘</h2>

      {/* 筛选器区域 */}
      <div className="bg-bkg-paper p-6 rounded-xl shadow-lg mb-8">
        <h3 className="text-xl font-semibold text-primary mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">分类</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-bkg-default text-text-primary focus:ring-primary focus:border-primary transition"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">收藏状态</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-bkg-default text-text-primary focus:ring-primary focus:border-primary transition"
            >
              {STATUSES.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleSpinClick}
          disabled={isLoading || !userInfo}
          className={`mt-6 w-full py-3 text-lg font-bold rounded-lg transition ${
            userInfo
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          {isLoading ? '抽取中...' : userInfo ? '开始抽取!' : '请先登录'}
        </button>
      </div>

      {/* 结果展示区域 */}
      {rouletteItem && (
        <div className="bg-bkg-paper p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-xl font-semibold text-primary mb-4">抽取结果</h3>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
            <img 
              src={rouletteItem.image || 'https://bgm.tv/img/no_icon_subject.png'} 
              alt={rouletteItem.name_cn || rouletteItem.name} 
              className="w-full md:w-40 h-auto object-cover rounded-lg shadow-md flex-shrink-0"
            />
            <div className="flex-1">
              <h4 className="text-2xl font-bold mb-1 text-text-primary">{rouletteItem.name_cn || rouletteItem.name}</h4>
              <p className="text-text-secondary text-sm mb-3">原名: {rouletteItem.name}</p>
              
              <div className="flex items-center space-x-2 text-xs text-text-secondary mb-4">
                <span className="bg-secondary/20 text-secondary px-2 py-1 rounded-full">{getLabelByValue(rouletteItem.category, CATEGORIES)}</span>
                <span className="bg-primary/20 text-primary px-2 py-1 rounded-full">{getLabelByValue(rouletteItem.status, STATUSES)}</span>
              </div>
              
              <p className="text-text-secondary mb-4 line-clamp-4">{rouletteItem.summary || '暂无简介'}</p>
              
              <div className="flex space-x-4 mt-2">
                <a 
                  href={`https://bgm.tv/subject/${rouletteItem.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center bg-gray-600/50 hover:bg-gray-600/80 text-text-primary font-semibold py-2 px-4 rounded-lg transition"
                >
                  在 Bangumi 上查看
                </a>
                 <button 
                    onClick={handleSpinClick}
                    className="flex-1 bg-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition"
                  >
                    再转一次
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 历史记录和日志区域，现在带有导出按钮 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <HistoryList />
        <LogList />
      </div>

    </div>
  );
};

export default RoulettePage;
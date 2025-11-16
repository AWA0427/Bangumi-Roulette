import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { RouletteItem, CATEGORIES, STATUSES } from '../types';
import { getRouletteItem } from '../services/bangumiService';

const RoulettePage: React.FC = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found");
  
  const { userInfo, accessToken, showSnackbar, addHistory, addLog } = context;

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
      const item = await getRouletteItem(userInfo.username, selectedCategory, selectedStatus, accessToken);
      setRouletteItem(item);
      addHistory({ item });
      showSnackbar('成功找到了一个项目！', 'success');
      addLog(`Roulette result: ${item.name_cn}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发生未知错误。';
      showSnackbar(errorMessage, 'error');
      addLog(`Error spinning roulette: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-6 text-text-primary">Bangumi 轮盘</h1>

      <div className="bg-bkg-paper shadow-lg rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-text-primary">筛选选项</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category-select" className="block text-sm font-medium text-text-secondary mb-1">分类</label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bkg-default border border-gray-600 rounded-lg p-2.5 text-text-primary focus:ring-primary focus:border-primary transition"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="status-select" className="block text-sm font-medium text-text-secondary mb-1">状态</label>
            <select
              id="status-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bkg-default border border-gray-600 rounded-lg p-2.5 text-text-primary focus:ring-primary focus:border-primary transition"
            >
              {STATUSES.map((stat) => (
                <option key={stat.value} value={stat.value}>{stat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-bkg-paper shadow-lg rounded-xl p-8 mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2 text-text-primary">准备好了吗？</h2>
        <p className="text-text-secondary mb-4">点击下方按钮，从您的收藏中随机选择一个项目。</p>
        <button 
          onClick={handleSpinClick}
          disabled={isLoading || !userInfo}
          className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              转动中...
            </div>
          ) : "开始轮盘"}
        </button>
        {!userInfo && <p className="text-sm text-yellow-500 mt-3">请从侧边栏“登录”以启用此功能。</p>}
      </div>

      {rouletteItem && (
        <div className="bg-bkg-paper shadow-lg rounded-xl overflow-hidden animate-fade-in">
          <img 
            className="w-full h-48 object-cover" 
            src={rouletteItem.image}
            alt={rouletteItem.name_cn || rouletteItem.name} 
          />
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-2 text-text-primary">{rouletteItem.name_cn}</h3>
            <p className="text-text-secondary text-sm mb-4">{rouletteItem.name}</p>
            <p className="text-text-secondary mb-4">{rouletteItem.summary}</p>
            <div className="flex items-center space-x-2 text-sm text-text-secondary mb-6">
              <span className="bg-secondary/20 text-secondary px-2 py-1 rounded-full">{getLabelByValue(rouletteItem.category, CATEGORIES)}</span>
              <span className="bg-primary/20 text-primary px-2 py-1 rounded-full">{getLabelByValue(rouletteItem.status, STATUSES)}</span>
            </div>
            <div className="flex space-x-4">
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
      )}
    </div>
  );
};

export default RoulettePage;
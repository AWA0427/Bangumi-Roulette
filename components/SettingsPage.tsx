import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';

interface SettingsPageProps {
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  onResetAllSettings: () => void;
}

// Helper to download files in the browser
const downloadFile = (content: string, fileName: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const SettingsPage: React.FC<SettingsPageProps> = ({ primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor, onResetAllSettings }) => {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppContext not found");
  
  const { 
    nsfwEnabled, setNsfwEnabled, 
    nsfwOnly, setNsfwOnly,
    logs, setLogs,
    history, setHistory,
    showSnackbar, addLog
  } = context;

  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [isResetModalOpen, setResetModalOpen] = useState(false);

  const handleExportLogs = () => {
    const logContent = logs.map(log => `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`).join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(logContent, `bangumi-roulette-logs-${timestamp}.txt`, 'text/plain');
    addLog("导出了日志。");
    showSnackbar("日志导出成功！", "success");
  };

  const handleClearLogs = () => {
    setLogs([]);
    addLog("清除了日志。");
    showSnackbar("日志已清除。", "info");
  };

  const handleExportHistory = () => {
    const historyContent = JSON.stringify(history, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadFile(historyContent, `bangumi-roulette-history-${timestamp}.json`, 'application/json');
    addLog("导出了历史记录。");
    showSnackbar("历史记录导出成功！", "success");
  };

  const handleClearHistory = () => {
    setHistory([]);
    addLog("清除了历史记录。");
    showSnackbar("历史记录已清除。", "info");
  };
  
  const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }> = ({ checked, onChange, disabled }) => (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; actions: React.ReactNode; }> = ({ isOpen, onClose, title, children, actions }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-bkg-paper rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl leading-none">&times;</button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">{children}</div>
          <div className="flex justify-end p-4 border-t border-gray-700 space-x-2">{actions}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary">设置</h1>
      
      {/* Preferences */}
      <section className="bg-bkg-paper shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">偏好设置</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-text-primary">启用 NSFW 内容</p>
              <p className="text-sm text-text-secondary">允许在轮盘结果中出现成人内容。</p>
            </div>
            <ToggleSwitch checked={nsfwEnabled} onChange={setNsfwEnabled} />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className={`font-medium ${!nsfwEnabled ? 'text-gray-500' : 'text-text-primary'}`}>仅限 NSFW 内容</p>
              <p className={`text-sm ${!nsfwEnabled ? 'text-gray-600' : 'text-text-secondary'}`}>筛选掉所有非成人内容。</p>
            </div>
            <ToggleSwitch checked={nsfwOnly} onChange={setNsfwOnly} disabled={!nsfwEnabled} />
          </div>
        </div>
      </section>

      {/* Theme Customization */}
      <section className="bg-bkg-paper shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">主题定制</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-1">主题色</label>
            <div className="flex items-center bg-bkg-default border border-gray-600 rounded-lg p-2.5">
              <div style={{ backgroundColor: primaryColor }} className="w-6 h-6 rounded-full border border-gray-500 mr-3"></div>
              <span>{primaryColor}</span>
              <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-text-secondary mb-1">次要主题色</label>
            <div className="flex items-center bg-bkg-default border border-gray-600 rounded-lg p-2.5">
              <div style={{ backgroundColor: secondaryColor }} className="w-6 h-6 rounded-full border border-gray-500 mr-3"></div>
              <span>{secondaryColor}</span>
              <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
            </div>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="bg-bkg-paper shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">数据管理</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => setHistoryModalOpen(true)} className="text-left p-4 bg-bkg-default hover:bg-white/10 rounded-lg transition">查看轮盘历史</button>
          <button onClick={() => setLogModalOpen(true)} className="text-left p-4 bg-bkg-default hover:bg-white/10 rounded-lg transition">查看应用日志</button>
        </div>
      </section>
      
      {/* Reset Settings */}
      <section className="bg-bkg-paper shadow-lg rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">重置设置</h2>
        <div className="flex justify-between items-center">
            <div>
                <p className="font-medium text-text-primary">重置所有设置</p>
                <p className="text-sm text-text-secondary">将所有偏好和主题恢复为默认值。</p>
            </div>
            <button 
                onClick={() => setResetModalOpen(true)}
                className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
            >
                重置
            </button>
        </div>
      </section>

      {/* History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} title="轮盘历史" actions={
        <>
          <button onClick={handleClearHistory} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition">清除历史</button>
          <button onClick={handleExportHistory} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">导出历史</button>
        </>
      }>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="bg-bkg-default p-3 rounded-lg">
                <p className="text-sm text-text-secondary">{new Date(h.timestamp).toLocaleString()}</p>
                <p className="font-semibold text-text-primary">{h.item.name_cn}</p>
              </div>
            ))}
          </div>
        ) : <p>暂无历史记录。</p>}
      </Modal>

      {/* Log Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setLogModalOpen(false)} title="应用日志" actions={
        <>
          <button onClick={handleClearLogs} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition">清除日志</button>
          <button onClick={handleExportLogs} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition">导出日志</button>
        </>
      }>
        {logs.length > 0 ? (
          <pre className="text-xs whitespace-pre-wrap font-mono bg-bkg-default p-3 rounded-lg">
            {logs.map((log, i) => `[${new Date(log.timestamp).toLocaleString()}] ${log.message}`).join('\n')}
          </pre>
        ) : <p>暂无日志记录。</p>}
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => setResetModalOpen(false)} 
        title="确认重置设置" 
        actions={
            <>
                <button onClick={() => setResetModalOpen(false)} className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition">取消</button>
                <button 
                    onClick={() => {
                        onResetAllSettings();
                        setResetModalOpen(false);
                    }}
                    className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition"
                >
                    确认重置
                </button>
            </>
    }>
        <p>您确定要将所有设置恢复为默认值吗？此操作无法撤销。</p>
    </Modal>

    </div>
  );
};

export default SettingsPage;
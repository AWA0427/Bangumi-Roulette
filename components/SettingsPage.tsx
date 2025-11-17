// src/components/SettingsPage.tsx
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../contexts/AppContext';
import { LogEntry, HistoryEntry } from '../types';

const DEFAULT_PRIMARY_COLOR = "#6750A4";
const DEFAULT_SECONDARY_COLOR = "#6A5F7B";

// 辅助组件: DataListViewContent (用于展示历史和日志)
interface DataListViewContentProps<T> {
    data: T[];
    title: string;
    renderItem: (item: T, index: number) => React.ReactNode;
    onClear: () => void;
}

const DataListViewContent = <T extends LogEntry | HistoryEntry>({ data, title, renderItem, onClear }: DataListViewContentProps<T>) => {
    // 导出功能逻辑
    const context = useContext(AppContext);
    const downloadData = (data: T[], prefix: string) => {
        if (!context) return;
        const now = new Date();
        const formatNumber = (num: number) => num.toString().padStart(2, '0');
        const timestamp = `${now.getFullYear()}${formatNumber(now.getMonth() + 1)}${formatNumber(now.getDate())}${formatNumber(now.getHours())}${formatNumber(now.getMinutes())}${formatNumber(now.getSeconds())}`;
        
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
        context.showSnackbar(`${title}已成功导出`, 'success');
        context.addLog(`I/O操作: ${title}已导出到 ${filename}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end space-x-2">
                <button 
                    onClick={() => downloadData(data, title === '轮盘历史' ? 'bangumi_roulette_history_' : 'bangumi_roulette_log_')}
                    className="text-primary hover:text-primary/80 transition duration-200"
                    disabled={data.length === 0}
                >
                    导出 {title}
                </button>
                <button 
                    onClick={() => {
                        onClear();
                        context?.showSnackbar(`已清空${title}`, 'info');
                    }}
                    className="text-red-500 hover:text-red-700 transition duration-200"
                    disabled={data.length === 0}
                >
                    清空 {title}
                </button>
            </div>

            {data.length === 0 ? (
                <p className="text-text-secondary italic">没有 {title} 记录。</p>
            ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                    {/* 🚀 修复: 移除 reverse()，使最新的条目位于最下方 (从下往上排列) */}
                    {data.map(renderItem)}
                </div>
            )}
        </div>
    );
};

// 滑动开关组件 (样式保留)
const ToggleSwitch: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    title?: string;
}> = ({ label, checked, onChange, disabled = false, title }) => (
    <div className="flex justify-between items-center py-2 border-b border-bkg-default/50 last:border-b-0" title={title}>
        <span className={`text-text-primary ${disabled ? 'opacity-50' : ''}`}>{label}</span>
        <label className="relative inline-flex items-center cursor-pointer" aria-disabled={disabled}>
            <input 
                type="checkbox" 
                value="" 
                className="sr-only peer" 
                checked={checked} 
                onChange={(e) => !disabled && onChange(e.target.checked)}
                disabled={disabled}
            />
            <div 
                className={`w-11 h-6 rounded-full peer 
                           ${checked ? 'bg-primary' : 'bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50'} 
                           ${disabled 
                               ? 'opacity-50 cursor-not-allowed' 
                               // 确保 checked 状态和 disabled 状态的样式逻辑正确
                               : 'peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all' 
                           }`
                }
            ></div>
        </label>
    </div>
);

// 模态框组件 (保留)
const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-bkg-paper rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-bkg-default">
                    <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ------------------------------------------------------------
// SettingsPage 主组件
// ------------------------------------------------------------
const SettingsPage: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { 
        // 🚀 恢复: mode, toggleMode
        mode, toggleMode,
        nsfwEnabled, 
        setNsfwEnabled: setNsfwEnabledContext, 
        nsfwOnly, 
        setNsfwOnly: setNsfwOnlyContext, 
        primaryColor, setPrimaryColor, 
        secondaryColor, setSecondaryColor, 
        logs, setLogs, 
        history, setHistory, 
        showSnackbar, 
        addLog
    } = context;

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // 辅助函数: 封装模态框的渲染
    const renderModal = (isOpen: boolean, onClose: () => void, title: string, content: React.ReactNode) => (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            {content}
        </Modal>
    );

    // 颜色选择器 change 事件处理器
    const handleColorChange = (setter: (color: string) => void, colorType: 'Primary' | 'Secondary') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setter(newColor);
        localStorage.setItem(`${colorType.toLowerCase()}Color`, newColor);
        addLog(`UI操作: ${colorType} 主题色已更新为 ${newColor}`);
    };
    
    // 封装 NSFW Toggle 的 onChange 函数，确保日志和本地存储正确
    const setNsfwEnabled = (checked: boolean) => {
        setNsfwEnabledContext(checked);
        localStorage.setItem('nsfwEnabled', checked.toString());
        addLog(`设置操作: 允许显示成人内容已${checked ? '开启' : '关闭'}`, 'info'); 
    };

    const setNsfwOnly = (checked: boolean) => {
        setNsfwOnlyContext(checked);
        localStorage.setItem('nsfwOnly', checked.toString());
        addLog(`设置操作: 仅显示成人内容已${checked ? '开启' : '关闭'}`, 'info'); 
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-text-primary mb-6">应用设置</h2>

            {/* 主题设置 */}
            <div className="bg-bkg-paper p-6 rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-semibold text-text-primary border-b border-bkg-default/50 pb-2">主题定制</h3>
                
                {/* 🚀 恢复: 暗色模式开关 */}
                <ToggleSwitch
                    label="暗色模式 (Dark Mode)"
                    checked={mode === 'dark'}
                    onChange={toggleMode}
                    title="切换应用的亮色和暗色模式。"
                />
                
                {/* 颜色选择器 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Color */}
                    <div className="flex items-center justify-between p-2 border border-bkg-default rounded-lg">
                        <label htmlFor="primaryColor" className="text-text-primary">主题主色</label>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="color" 
                                id="primaryColor" 
                                value={primaryColor} 
                                onChange={handleColorChange(setPrimaryColor, 'Primary')}
                                className="w-8 h-8 rounded-full border-none cursor-pointer"
                            />
                            <span className="text-sm font-mono text-text-secondary uppercase">{primaryColor}</span>
                        </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="flex items-center justify-between p-2 border border-bkg-default rounded-lg">
                        <label htmlFor="secondaryColor" className="text-text-primary">主题副色</label>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="color" 
                                id="secondaryColor" 
                                value={secondaryColor} 
                                onChange={handleColorChange(setSecondaryColor, 'Secondary')}
                                className="w-8 h-8 rounded-full border-none cursor-pointer"
                            />
                            <span className="text-sm font-mono text-text-secondary uppercase">{secondaryColor}</span>
                        </div>
                    </div>
                </div>

                {/* 主题操作按钮 */}
                <div className="flex space-x-4 pt-2">
                    <button
                        onClick={() => {
                            setPrimaryColor(DEFAULT_PRIMARY_COLOR);
                            setSecondaryColor(DEFAULT_SECONDARY_COLOR);
                            localStorage.removeItem('primaryColor');
                            localStorage.removeItem('secondaryColor');
                            showSnackbar('主题色已恢复默认', 'info');
                            addLog('UI操作: 主题色已恢复默认');
                        }}
                        className="w-full py-2 px-4 rounded-lg bg-gray-200 text-text-secondary hover:bg-gray-300 transition font-semibold text-sm"
                    >
                        恢复默认主题
                    </button>
                </div>
            </div>

            {/* 内容筛选设置 */}
            <div className="bg-bkg-paper p-6 rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-semibold text-text-primary border-b border-bkg-default/50 pb-2">内容筛选</h3>
                
                <ToggleSwitch 
                    label="允许显示成人内容 (NSFW)"
                    checked={nsfwEnabled}
                    onChange={setNsfwEnabled} 
                    title="开启后，轮盘抽取结果可能包含 Bangumi 标记的 NSFW 内容。"
                />
                <ToggleSwitch 
                    label="仅显示成人内容 (NSFW Only)"
                    checked={nsfwOnly}
                    onChange={setNsfwOnly} 
                    disabled={!nsfwEnabled} // 🚀 确保此逻辑正确，当“允许显示成人内容”关闭时，此开关必须被禁用（显示为灰色）。
                    title="仅当 '允许显示成人内容' 开启时可用。开启后，轮盘将只抽取 NSFW 内容。"
                />
            </div>

            {/* 数据管理 */}
            <div className="bg-bkg-paper p-6 rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-semibold text-text-primary border-b border-bkg-default/50 pb-2">数据管理</h3>
                
                <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="w-full text-left py-3 px-4 rounded-lg bg-bkg-default hover:bg-gray-200 transition text-text-primary flex justify-between items-center"
                >
                    <span>查看轮盘历史 ({history.length} 条)</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
                
                <button
                    onClick={() => setIsLogModalOpen(true)}
                    className="w-full text-left py-3 px-4 rounded-lg bg-bkg-default hover:bg-gray-200 transition text-text-primary flex justify-between items-center"
                >
                    <span>查看应用日志 ({logs.length} 条)</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {/* 日志模态框 */}
            {renderModal(
                isLogModalOpen, 
                () => setIsLogModalOpen(false), 
                '应用日志', 
                <DataListViewContent<LogEntry> 
                    data={logs}
                    title="应用日志"
                    renderItem={(log, index) => (
                        <div key={index} className={`p-1 text-xs border-b border-bkg-default/30 ${log.severity === 'error' ? 'text-red-500' : log.severity === 'warning' ? 'text-yellow-600' : 'text-text-primary'}`}>
                            <span className="font-mono text-xs text-text-secondary mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            {log.message}
                        </div>
                    )}
                    onClear={() => setLogs([])}
                />
            )}

            {/* 历史记录模态框 */}
            {renderModal(
                isHistoryModalOpen, 
                () => setIsHistoryModalOpen(false), 
                '轮盘历史记录', 
                <DataListViewContent<HistoryEntry> 
                    data={history}
                    title="轮盘历史"
                    renderItem={(entry, index) => (
                        <div key={index} className="p-2 border-b border-bkg-default/30">
                            <h4 className="font-medium text-text-primary">{entry.item.name_cn || entry.item.name}</h4>
                            <p className="text-xs text-text-secondary">抽取于: {new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                    )}
                    onClear={() => setHistory([])}
                />
            )}
        </div>
    );
};

export default SettingsPage;
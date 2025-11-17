// src/components/HistoryList.tsx
import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

const HistoryList: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    
    const { history } = context;

    return (
        <div className="space-y-4">
            {history.length === 0 ? (
                <p className="text-text-secondary italic">轮盘历史记录为空。</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.map((entry, index) => (
                        <div 
                            key={index} 
                            className="bg-bkg-default p-3 rounded-lg shadow-sm hover:shadow-md transition duration-200"
                        >
                            <div className="flex items-center space-x-3">
                                <img 
                                    src={entry.item.image_url || 'https://bgm.tv/img/no_icon_subject.png'} 
                                    alt={entry.item.name_cn || entry.item.name} 
                                    className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                                />
                                <div>
                                    <h4 className="text-text-primary font-semibold text-sm">
                                        {entry.item.name_cn || entry.item.name}
                                    </h4>
                                    <p className="text-text-secondary text-xs">
                                        {entry.item.summary ? entry.item.summary.substring(0, 30) + '...' : '无简介'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-2 text-xs text-text-secondary border-t border-bkg-paper/50 pt-2">
                                <p>抽取时间: {new Date(entry.timestamp).toLocaleString()}</p>
                                <a 
                                    href={`https://bgm.tv/subject/${entry.item.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    查看详情
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryList;
import { createContext, Dispatch, SetStateAction } from 'react';
import { UserInfo, LogEntry, HistoryEntry } from '../types';

interface AppContextType {
  userInfo: UserInfo | null;
  setUserInfo: Dispatch<SetStateAction<UserInfo | null>>;
  accessToken: string | null;
  setAccessToken: Dispatch<SetStateAction<string | null>>;
  nsfwEnabled: boolean;
  setNsfwEnabled: Dispatch<SetStateAction<boolean>>;
  nsfwOnly: boolean;
  setNsfwOnly: Dispatch<SetStateAction<boolean>>;
  logs: LogEntry[];
  addLog: (message: string) => void;
  setLogs: Dispatch<SetStateAction<LogEntry[]>>;
  history: HistoryEntry[];
  addHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  setHistory: Dispatch<SetStateAction<HistoryEntry[]>>;
  showSnackbar: (message: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
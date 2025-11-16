
export interface UserInfo {
  id: number;
  username: string; // The unique username, e.g., "mono"
  nickname: string; // The display name, e.g., "mono"
  avatarUrl?: string;
}

export interface RouletteItem {
  id: number;
  name_cn: string;
  name: string;
  image: string;
  summary: string;
  category: string;
  status: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface HistoryEntry {
  timestamp: string;
  item: RouletteItem;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

export const CATEGORIES = [
  { value: 'anime', label: '动画' },
  { value: 'book', label: '书籍' },
  { value: 'music', label: '音乐' },
  { value: 'game', label: '游戏' },
  { value: 'real', label: '三次元' },
];

export const STATUSES = [
  { value: 'want_to_watch', label: '想看' },
  { value: 'watching', label: '在看' },
  { value: 'completed', label: '看过' },
  { value: 'on_hold', label: '搁置' },
  { value: 'dropped', label: '抛弃' },
];

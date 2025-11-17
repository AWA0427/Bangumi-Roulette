import { RouletteItem } from '../types';

const API_BASE_URL = 'https://api.bgm.tv/v0';

const CATEGORY_MAP: { [key: string]: number } = {
  anime: 2,
  book: 1,
  music: 3,
  game: 4,
  real: 6,
};

const STATUS_MAP: { [key: string]: number } = {
  want_to_watch: 1,
  watching: 3,
  completed: 2,
  on_hold: 4,
  dropped: 5,
};

// Helper function to make authenticated API requests
const fetchFromBangumi = async (endpoint: string, accessToken: string) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Bangumi-Roulette-Web (https://github.com/AWA0427/Bangumi-Roulette)',
    },
  });

  if (response.status === 401) {
    throw new Error('Bangumi 访问令牌无效或已过期，请重新登录。');
  }
  if (!response.ok) {
    throw new Error(`无法连接到 Bangumi API (状态: ${response.status})。`);
  }
  return response.json();
};

export const getRouletteItem = async (
  username: string,
  category: string,
  status: string,
  accessToken: string
): Promise<RouletteItem> => {
  const subjectType = CATEGORY_MAP[category];
  const collectionType = STATUS_MAP[status];

  if (subjectType === undefined || collectionType === undefined) {
    throw new Error('无效的分类或状态。');
  }

  // 1. Make a pre-flight request to get the total count of items in the collection
  const countUrl = `/users/${username}/collections?subject_type=${subjectType}&type=${collectionType}&limit=1`;
  const countResponse = await fetchFromBangumi(countUrl, accessToken);
  
  const totalItems = countResponse.total;
  if (totalItems === 0) {
    throw new Error('在该筛选条件下，您的收藏中没有找到任何项目。');
  }

  // 2. Generate a random offset
  const randomOffset = Math.floor(Math.random() * totalItems);

  // 3. Fetch the single random item using the offset
  const itemUrl = `/users/${username}/collections?subject_type=${subjectType}&type=${collectionType}&limit=1&offset=${randomOffset}`;
  const itemResponse = await fetchFromBangumi(itemUrl, accessToken);

  if (!itemResponse.data || itemResponse.data.length === 0) {
    throw new Error('无法获取随机项目，请重试。');
  }

  const collectionEntry = itemResponse.data[0];
  const subject = collectionEntry.subject;

  // 4. Map the API response to our internal RouletteItem type
  const rouletteItem: RouletteItem = {
    id: subject.id,
    name: subject.name,
    name_cn: subject.name_cn || subject.name,
    image: subject.images?.large || 'https://via.placeholder.com/600x300?text=No+Image',
    summary: subject.summary || '暂无简介。',
    category,
    status,
  };

  return rouletteItem;
};
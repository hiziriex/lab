import pkg from '../../package.json';
export const site = {
  name: 'Hiziriex Lab',
  description: '電子回路・電源設計に役立つ計算ツールと技術資料をまとめたエンジニア向けサイト。',
  version: pkg.version,
  github: 'https://github.com/hiziriex/lab',
  author: 'ひじり',
  twitterUrl: undefined as string | undefined,
};
export const withBase = (path = '') =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

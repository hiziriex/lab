// 候補の識別子（順位）で固定する共通 series palette。graph / legend も参照する。
// 白いcheck markとのcontrastを保ち、dark背景のグラフ線にも3:1以上を確保する。
export const candidateSeriesColors = [
  '#145fa0',
  '#b42332',
  '#23733d',
  '#7040a0',
  '#a34c00',
] as const;

// 線種も表・凡例・グラフの識別子に固定し、色だけに依存しない。
export const candidateSeriesDashes: (number[] | undefined)[] = [
  undefined,
  [8, 4],
  [2, 3],
  [10, 3, 2, 3],
  [6, 3, 2, 3, 2, 3],
];

export const candidateSeriesDarkColors = [
  '#1968ad',
  '#be2d3d',
  '#23733d',
  '#8052b0',
  '#a34c00',
] as const;
export const candidateSeriesCssColor = (rank: number) =>
  `light-dark(${candidateSeriesColors[rank - 1]}, ${candidateSeriesDarkColors[rank - 1]})`;

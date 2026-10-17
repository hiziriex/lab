// white / dark背景それぞれで識別できる計測cursor色。文字・線種も併用する。
export const cursorColors = {
  light: { a: '#946200', b: '#bc400a' },
  dark: { a: '#facc15', b: '#fb923c' },
} as const;
export const cursorCssColor = (key: 'a' | 'b') =>
  `light-dark(${cursorColors.light[key]}, ${cursorColors.dark[key]})`;

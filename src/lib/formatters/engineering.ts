const symbols: Record<number, string> = {
  '-18': 'a',
  '-15': 'f',
  '-12': 'p',
  '-9': 'n',
  '-6': 'µ',
  '-3': 'm',
  0: '',
  3: 'k',
  6: 'M',
  9: 'G',
  12: 'T',
  15: 'P',
};
export function formatEngineering(value: number, unit: string): string {
  if (!Number.isFinite(value)) return `— ${unit}`;
  if (value === 0) return `0 ${unit}`;
  let exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3;
  if (exponent < -18 || exponent > 15) return `${value.toExponential(3)} ${unit}`;
  let scaled = Number((value / 10 ** exponent).toPrecision(4));
  if (Math.abs(scaled) >= 1000 && exponent < 15) {
    exponent += 3;
    scaled /= 1000;
  }
  return `${scaled} ${symbols[exponent]}${unit}`;
}

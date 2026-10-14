import { isNumericalZero } from './numeric';
import type { CalculationError, CalculationResult } from './types';
export type DividerInput = {
  vin: number;
  targetVout: number;
  currentEnabled: boolean;
  targetCurrent: number;
  series: 'E12' | 'E24';
};
export type VoltageDividerCandidate = {
  rank: number;
  r1: number;
  r2: number;
  actualVout: number;
  absoluteError: number;
  relativeErrorPercent: number;
  actualDividerCurrent: number;
  r1Power: number;
  r2Power: number;
};
export const seriesValues = {
  E12: [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82],
  E24: [
    10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91,
  ],
} as const;
export function validateDivider(input: DividerInput): CalculationError[] {
  const errors: CalculationError[] = [];
  for (const field of [
    'vin',
    'targetVout',
    ...(input.currentEnabled ? (['targetCurrent'] as const) : []),
  ] as const) {
    if (!Number.isFinite(input[field]) || input[field] <= 0)
      errors.push({
        code: 'out_of_range',
        field,
        message: `0 ${field === 'targetCurrent' ? 'A' : 'V'}より大きい有限の値を入力してください`,
      });
  }
  if (input.targetVout >= input.vin)
    errors.push({
      code: 'out_of_range',
      field: 'targetVout',
      message: '目標 Vout は Vin より小さい値を入力してください',
    });
  if (!(input.series in seriesValues))
    errors.push({
      code: 'out_of_range',
      field: 'series',
      message: 'E12 または E24 を選択してください',
    });
  return errors;
}
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
export function calculateVoltageDivider(
  input: DividerInput,
): CalculationResult<{ candidates: VoltageDividerCandidate[] }> {
  const errors = validateDivider(input);
  if (errors.length) return { ok: false, errors };
  const candidates: VoltageDividerCandidate[] = [];
  const seen = new Set<string>();
  // 相対 decade を広く列挙し、有理数の既約形で同一比率を除外する。
  for (let decade = -6; decade <= 6; decade++)
    for (const a of seriesValues[input.series])
      for (const b of seriesValues[input.series]) {
        const upper = a * 10 ** Math.max(decade, 0);
        const lower = b * 10 ** Math.max(-decade, 0);
        const divisor = gcd(upper, lower);
        const key = `${upper / divisor}/${lower / divisor}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // 対数距離が最小の decade を採用。電流指定は電圧誤差の順位を制約しない。
        const exponent = input.currentEnabled
          ? Math.round(
              Math.log10(input.vin) - Math.log10(input.targetCurrent) - Math.log10(upper + lower),
            )
          : 3 - Math.floor(Math.log10(Math.min(upper, lower)));
        const r1 = upper * 10 ** exponent;
        const r2 = lower * 10 ** exponent;
        const actualVout = input.vin * (lower / (upper + lower));
        const actualDividerCurrent = input.vin / (r1 + r2);
        const absoluteError = actualVout - input.targetVout;
        const candidate = {
          rank: 0,
          r1,
          r2,
          actualVout,
          absoluteError,
          relativeErrorPercent: (absoluteError / input.targetVout) * 100,
          actualDividerCurrent,
          r1Power: actualDividerCurrent * (input.vin - actualVout),
          r2Power: actualDividerCurrent * actualVout,
        };
        if (
          [r1, r2, actualVout, actualDividerCurrent].some((v) => !Number.isFinite(v) || v <= 0) ||
          !Object.values(candidate).every(Number.isFinite)
        )
          continue;
        candidates.push(candidate);
      }
  const currentDistance = (c: VoltageDividerCandidate) =>
    Math.abs(Math.log10(c.actualDividerCurrent) - Math.log10(input.targetCurrent));
  const rankingError = (c: VoltageDividerCandidate) =>
    isNumericalZero({ value: c.absoluteError, scale: Math.max(c.actualVout, input.targetVout) })
      ? 0
      : Math.abs(c.absoluteError);
  const compareError = (a: VoltageDividerCandidate, b: VoltageDividerCandidate) => {
    const difference = rankingError(a) - rankingError(b);
    return isNumericalZero({
      value: difference,
      scale: Math.max(input.targetVout, a.actualVout, b.actualVout),
    })
      ? 0
      : difference;
  };
  candidates.sort(
    (a, b) =>
      compareError(a, b) ||
      (input.currentEnabled ? currentDistance(a) - currentDistance(b) : 0) ||
      a.r1 - b.r1 ||
      a.r2 - b.r2,
  );
  if (candidates.length < 5)
    return {
      ok: false,
      errors: [
        {
          code: 'out_of_range',
          message: 'この入力では有限値の候補を計算できません。値の桁を確認してください。',
        },
      ],
    };
  return {
    ok: true,
    value: { candidates: candidates.slice(0, 5).map((c, i) => ({ ...c, rank: i + 1 })) },
  };
}

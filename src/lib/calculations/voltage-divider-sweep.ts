import type { CalculationError, CalculationResult } from './types';
import type { VoltageDividerCandidate } from './voltage-divider';
export type SweepCandidate = Pick<VoltageDividerCandidate, 'rank' | 'r1' | 'r2'>;
export type DividerSweepSeries = SweepCandidate & {
  points: { vin: number; vout: number }[];
};
export function calculateVoltageDividerSweep({
  candidates,
  vinMin,
  vinMax,
}: {
  candidates: SweepCandidate[];
  vinMin: number;
  vinMax: number;
}): CalculationResult<{ series: DividerSweepSeries[] }> {
  const errors: CalculationError[] = [];
  if (!Number.isFinite(vinMin) || vinMin < 0)
    errors.push({
      code: 'out_of_range',
      field: 'vinMin',
      message: '0 V以上の有限の値を入力してください',
    });
  if (!Number.isFinite(vinMax) || vinMax <= vinMin)
    errors.push({
      code: 'out_of_range',
      field: 'vinMax',
      message: 'Vin minより大きい有限の値を入力してください',
    });
  if (
    candidates.some(
      ({ r1, r2 }) => !Number.isFinite(r1) || !Number.isFinite(r2) || r1 <= 0 || r2 <= 0,
    )
  )
    errors.push({
      code: 'out_of_range',
      field: 'candidates',
      message: '抵抗値は正の有限値が必要です',
    });
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      series: candidates.map((candidate) => {
        const scale = Math.max(candidate.r1, candidate.r2);
        const ratio = candidate.r2 / scale / (candidate.r1 / scale + candidate.r2 / scale);
        return {
          ...candidate,
          points: [vinMin, vinMax].map((vin) => ({ vin, vout: vin * ratio })),
        };
      }),
    },
  };
}

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
        const ratio = calculateCandidateRatio(candidate);
        return {
          ...candidate,
          points: [vinMin, vinMax].map((vin) => ({ vin, vout: vin * ratio })),
        };
      }),
    },
  };
}

export type SweepMode = 'output' | 'comparison';
export type SweepDesign = { nominalVin: number; targetVout: number };
// nominalを包む構造を共通化し、後続のmin / maxを追加する場所を確保する。
export type SweepReading = { vin: number; nominal: { vout: number; ideal: number; error: number } };
export function calculateCandidateRatio({ r1, r2 }: Pick<SweepCandidate, 'r1' | 'r2'>): number {
  const scale = Math.max(r1, r2);
  return r2 / scale / (r1 / scale + r2 / scale);
}
export function calculateTargetRatio({ nominalVin, targetVout }: SweepDesign): number {
  return targetVout / nominalVin;
}
// 呼び出し側で検証済みの候補・設計・Vinを使う。描画sampleや表示文字列を参照しない。
export function calculateSweepReading({
  candidate,
  design,
  vin,
}: {
  candidate: SweepCandidate;
  design: SweepDesign;
  vin: number;
}): SweepReading {
  const vout = vin * calculateCandidateRatio(candidate);
  const ideal = vin * calculateTargetRatio(design);
  return { vin, nominal: { vout, ideal, error: vout - ideal } };
}
export function calculateSweepDelta({ a, b }: { a: SweepReading; b: SweepReading }) {
  const vin = b.vin - a.vin;
  const vout = b.nominal.vout - a.nominal.vout;
  const error = b.nominal.error - a.nominal.error;
  return {
    vin,
    nominal: {
      vout,
      error,
      outputSlope: vin === 0 ? null : vout / vin,
      errorSlope: vin === 0 ? null : error / vin,
    },
  };
}

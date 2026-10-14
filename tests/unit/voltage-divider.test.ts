import { describe, it, expect } from 'vitest';
import { calculateVoltageDivider, seriesValues } from '../../src/lib/calculations/voltage-divider';
import { defaultInput, invalidNumbers } from '../fixtures/divider';
describe('分圧抵抗候補', () => {
  it.each(['E12', 'E24'] as const)('%s の候補は有限・順位順・比率重複なし', (series) => {
    const result = calculateVoltageDivider({ ...defaultInput, series });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const c = result.value.candidates;
    expect(c).toHaveLength(5);
    expect(new Set(c.map((x) => (x.r1 / x.r2).toPrecision(12))).size).toBe(5);
    for (const [i, x] of c.entries()) {
      expect(x.rank).toBe(i + 1);
      expect(Object.values(x).every(Number.isFinite)).toBe(true);
      expect(x.actualVout).toBeCloseTo((5 * x.r2) / (x.r1 + x.r2), 12);
      expect(x.actualDividerCurrent).toBeCloseTo(5 / (x.r1 + x.r2), 12);
      expect(x.r1Power).toBeCloseTo(x.actualDividerCurrent ** 2 * x.r1, 12);
      expect(x.r2Power).toBeCloseTo(x.actualDividerCurrent ** 2 * x.r2, 12);
      expect(x.absoluteError).toBeCloseTo(x.actualVout - 3.3, 12);
      expect(x.relativeErrorPercent).toBeCloseTo((x.absoluteError / 3.3) * 100, 12);
      for (const r of [x.r1, x.r2])
        expect(seriesValues[series]).toContain(
          Math.round((r / 10 ** Math.floor(Math.log10(r))) * 10),
        );
      if (i > 0)
        expect(Math.abs(x.absoluteError)).toBeGreaterThanOrEqual(Math.abs(c[i - 1]!.absoluteError));
    }
    expect(calculateVoltageDivider({ ...defaultInput, series })).toEqual(result);
  });
  it('既知の一致比率を最上位に返す', () => {
    const r = calculateVoltageDivider({ ...defaultInput, targetVout: 2.5 });
    expect(r.ok && r.value.candidates[0]?.absoluteError).toBe(0);
  });
  it('電流 OFF では最小抵抗が 1k〜10k 未満', () => {
    const r = calculateVoltageDivider({
      ...defaultInput,
      currentEnabled: false,
      targetCurrent: NaN,
    });
    expect(r.ok).toBe(true);
    if (r.ok)
      for (const c of r.value.candidates) {
        expect(Math.min(c.r1, c.r2)).toBeGreaterThanOrEqual(1000);
        expect(Math.min(c.r1, c.r2)).toBeLessThan(10000);
      }
  });
  it('電流の桁を変えても比率順位を保つ', () => {
    const a = calculateVoltageDivider(defaultInput);
    const b = calculateVoltageDivider({ ...defaultInput, targetCurrent: 1e-6 });
    if (!a.ok || !b.ok) throw new Error('候補生成失敗');
    expect(a.value.candidates.map((c) => c.actualVout)).toEqual(
      b.value.candidates.map((c) => c.actualVout),
    );
    expect(b.value.candidates[0]!.r1 / a.value.candidates[0]!.r1).toBeCloseTo(1000);
  });
  for (const field of ['vin', 'targetVout', 'targetCurrent'] as const)
    it.each(invalidNumbers)(`${field} の不正値 %s を拒否`, (value) => {
      expect(calculateVoltageDivider({ ...defaultInput, [field]: value }).ok).toBe(false);
    });
  it.each([5, 6])('Vin 以上の目標 %s を拒否', (targetVout) => {
    expect(calculateVoltageDivider({ ...defaultInput, targetVout }).ok).toBe(false);
  });
  it('浮動小数点で表現できない結果を返さない', () => {
    expect(
      calculateVoltageDivider({
        ...defaultInput,
        vin: 1e308,
        targetVout: 5e307,
        targetCurrent: 1e-300,
      }).ok,
    ).toBe(false);
  });
});

it.each([1e-12, 1, 1e12])('scale %s で一致と実在する微小誤差を区別し生値を保つ', (scale) => {
  const input = {
    ...defaultInput,
    vin: 6 * scale,
    targetVout: 3.3 * scale,
    targetCurrent: 0.0015 * scale,
  };
  const exact = calculateVoltageDivider(input);
  expect(exact.ok).toBe(true);
  if (!exact.ok) return;
  const first = exact.value.candidates[0]!;
  expect(first.r1).toBeCloseTo(1800);
  expect(first.r2).toBeCloseTo(2200);
  expect(first.absoluteError).toBe(first.actualVout - input.targetVout);
  const shifted = calculateVoltageDivider({ ...input, targetVout: (3.3 + 5e-6) * scale });
  expect(shifted.ok).toBe(true);
  if (!shifted.ok) return;
  expect(Math.abs(shifted.value.candidates[0]!.absoluteError)).toBeGreaterThan(4.9e-6 * scale);
});

it('対称な非zero誤差も丸め noise で順位を変えず、抵抗値で tie-break する', () => {
  const result = calculateVoltageDivider({
    ...defaultInput,
    vin: 6,
    targetVout: 3,
    currentEnabled: false,
  });
  if (!result.ok) throw new Error('候補生成失敗');
  const candidates = result.value.candidates;
  for (let i = 1; i < candidates.length; i++) {
    const previous = candidates[i - 1]!;
    const current = candidates[i]!;
    if (
      Math.abs(Math.abs(previous.absoluteError) - Math.abs(current.absoluteError)) <=
      4 * Number.EPSILON * 6
    ) {
      expect(previous.r1).toBeLessThanOrEqual(current.r1);
    }
  }
});

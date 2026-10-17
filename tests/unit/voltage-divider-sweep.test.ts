import { it, expect } from 'vitest';
import { calculateVoltageDividerSweep as sweep } from '../../src/lib/calculations/voltage-divider-sweep';
const candidates = [
  { rank: 1, r1: 1000, r2: 2000 },
  { rank: 3, r1: 1000, r2: 1000 },
];
it('nominal分圧の範囲端点と複数候補を丸めず計算する', () => {
  const result = sweep({ candidates, vinMin: 3, vinMax: 6 });
  expect(result.ok).toBe(true);
  if (!result.ok) return;
  expect(result.value.series).toEqual([
    {
      ...candidates[0],
      points: [
        { vin: 3, vout: 2 },
        { vin: 6, vout: 4 },
      ],
    },
    {
      ...candidates[1],
      points: [
        { vin: 3, vout: 1.5 },
        { vin: 6, vout: 3 },
      ],
    },
  ]);
});
it('0 V開始と空選択を許可する', () => {
  const result = sweep({ candidates, vinMin: 0, vinMax: 5 });
  expect(result.ok && result.value.series[0]?.points[0]?.vout).toBe(0);
  expect(sweep({ candidates: [], vinMin: 0, vinMax: 1 })).toEqual({
    ok: true,
    value: { series: [] },
  });
});
it.each([
  [-1, 5],
  [2, 2],
  [5, 2],
  [NaN, 5],
  [0, NaN],
  [0, Infinity],
  [Infinity, 5],
])('不正な範囲(%s, %s)を拒否する', (vinMin, vinMax) => {
  expect(sweep({ candidates, vinMin, vinMax }).ok).toBe(false);
});
it.each([0, -1, NaN, Infinity])('不正な抵抗 %s を拒否する', (r) => {
  for (const candidate of [
    { rank: 1, r1: r, r2: 1 },
    { rank: 1, r1: 1, r2: r },
  ])
    expect(sweep({ candidates: [candidate], vinMin: 0, vinMax: 5 }).ok).toBe(false);
});
it('大きな抵抗の和でoverflowせず、入力も変更しない', () => {
  const candidate = Object.freeze({ rank: 1, r1: Number.MAX_VALUE, r2: Number.MAX_VALUE });
  const result = sweep({ candidates: [candidate], vinMin: 0, vinMax: Number.MAX_VALUE });
  expect(result.ok && result.value.series[0]?.points[1]?.vout).toBe(Number.MAX_VALUE / 2);
});

import {
  calculateCandidateRatio,
  calculateTargetRatio,
  calculateSweepReading,
  calculateSweepDelta,
} from '../../src/lib/calculations/voltage-divider-sweep';
const design = { nominalVin: 5, targetVout: 3.3 };
it('候補比・理想比と任意Vinの公称値・理想値・符号付き誤差', () => {
  expect(calculateCandidateRatio(candidates[0]!)).toBe(2 / 3);
  expect(calculateTargetRatio(design)).toBe(3.3 / 5);
  for (const vin of [0, 1.234567891234, 5, 9]) {
    const reading = calculateSweepReading({ candidate: candidates[0]!, design, vin });
    expect(reading.nominal.vout).toBe(vin * (2 / 3));
    expect(reading.nominal.ideal).toBe(vin * (3.3 / 5));
    expect(reading.nominal.error).toBe(reading.nominal.vout - reading.nominal.ideal);
  }
  expect(calculateSweepReading({ candidate: candidates[0]!, design, vin: 5 }).nominal.ideal).toBe(
    3.3,
  );
  expect(
    calculateSweepReading({ candidate: candidates[0]!, design, vin: 5 }).nominal.error,
  ).toBeGreaterThan(0);
  expect(
    calculateSweepReading({ candidate: candidates[1]!, design, vin: 5 }).nominal.error,
  ).toBeLessThan(0);
  expect(
    calculateSweepReading({
      candidate: candidates[1]!,
      design: { nominalVin: 5, targetVout: 2.5 },
      vin: 5,
    }).nominal.error,
  ).toBe(0);
});
it.each([
  [4.123456789, 5.987654321],
  [5.987654321, 4.123456789],
  [5, 5],
])('A=%s、B=%sは並べ替えずB-A、同一Vinは傾き未定義', (vinA, vinB) => {
  const a = calculateSweepReading({ candidate: candidates[0]!, design, vin: vinA });
  const b = calculateSweepReading({ candidate: candidates[0]!, design, vin: vinB });
  const delta = calculateSweepDelta({ a, b });
  expect(delta.vin).toBe(vinB - vinA);
  expect(delta.nominal.vout).toBe(b.nominal.vout - a.nominal.vout);
  expect(delta.nominal.error).toBe(b.nominal.error - a.nominal.error);
  if (vinA === vinB) {
    expect(delta.nominal.outputSlope).toBeNull();
    expect(delta.nominal.errorSlope).toBeNull();
  } else {
    expect(delta.nominal.outputSlope).toBeCloseTo(2 / 3, 12);
    expect(delta.nominal.errorSlope).toBeCloseTo(2 / 3 - 0.66, 12);
    expect(Math.sign(delta.nominal.vout)).toBe(Math.sign(vinB - vinA));
    expect(Math.sign(delta.nominal.error)).toBe(Math.sign(vinB - vinA));
  }
});

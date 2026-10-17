import { expect, it } from 'vitest';
import {
  calculateSweepCursorMove as move,
  calculateSweepCursorDrag as drag,
} from '../../src/lib/calculations/sweep-cursors';
import { formatCursorInput } from '../../src/lib/formatters/sweep';
const base = { cursors: { a: 5.600877192982456, b: 4.4 }, vinMin: 4, vinMax: 6 };
it.each(['a', 'b'] as const)('%sだけ選択した連続位置指定は他方を変えない', (key) => {
  const result = move({
    ...base,
    selected: { a: key === 'a', b: key === 'b' },
    motion: { type: 'place', vin: 5.123456789 },
  });
  expect(result[key]).toBe(5.123456789);
  expect(result[key === 'a' ? 'b' : 'a']).toBe(base.cursors[key === 'a' ? 'b' : 'a']);
});
it.each([4.5, 5.5, 10, -1])('両選択のA基準 %s でB-Aを維持して範囲に制限する', (vin) => {
  const result = move({ ...base, selected: { a: true, b: true }, motion: { type: 'place', vin } });
  expect(result.b! - result.a!).toBeCloseTo(base.cursors.b - base.cursors.a, 12);
  expect(result.a).toBeGreaterThanOrEqual(4);
  expect(result.a).toBeLessThanOrEqual(6);
  expect(result.b).toBeGreaterThanOrEqual(4);
  expect(result.b).toBeLessThanOrEqual(6);
});
it('keyboardの同時移動は同量で、端では両方が止まる', () => {
  const result = move({
    ...base,
    selected: { a: true, b: true },
    motion: { type: 'nudge', delta: 0.02 },
  });
  expect(result.a!).toBeCloseTo(base.cursors.a + 0.02, 14);
  expect(result.b!).toBeCloseTo(4.42, 14);
  const stopped = move({
    ...base,
    cursors: { a: 6, b: 4.8 },
    selected: { a: true, b: true },
    motion: { type: 'nudge', delta: 0.02 },
  });
  expect(stopped).toEqual({ a: 6, b: 4.8 });
});
it('順序を入れ替えず正のB-Aも保持する', () => {
  const result = move({
    ...base,
    cursors: { a: 4.4, b: 5.6 },
    selected: { a: true, b: true },
    motion: { type: 'place', vin: 5.5 },
  });
  expect(result.a).toBeCloseTo(4.8);
  expect(result.b).toBe(6);
});
it('未選択は移動せず、欠けたcursorは選択したもののみ初期化する', () => {
  expect(
    move({ ...base, selected: { a: false, b: false }, motion: { type: 'place', vin: 5 } }),
  ).toBe(base.cursors);
  expect(
    move({
      ...base,
      cursors: { a: null, b: null },
      selected: { a: true, b: false },
      motion: { type: 'place', vin: 5.123456789 },
    }),
  ).toEqual({ a: 5.123456789, b: null });
  expect(
    move({
      ...base,
      cursors: { a: 5, b: null },
      selected: { a: true, b: true },
      motion: { type: 'place', vin: 4.5 },
    }),
  ).toEqual({ a: 4.5, b: 4.5 });
});
it('cursor表示だけを短くformatし、小さい値を0へ潰さない', () => {
  expect(formatCursorInput(base.cursors.a)).toBe('5.6009');
  expect(formatCursorInput(1e-8)).toBe('1.000e-8');
  expect(formatCursorInput(null)).toBe('');
});

it.each(['a', 'b'] as const)(
  '%sの単独dragは選択状態に関係なく掴んだcursorだけを動かす',
  (cursor) => {
    const result = drag({ ...base, selected: { a: false, b: false }, cursor, delta: -0.123456789 });
    expect(result[cursor]).toBeCloseTo(base.cursors[cursor] - 0.123456789, 14);
    expect(result[cursor === 'a' ? 'b' : 'a']).toBe(base.cursors[cursor === 'a' ? 'b' : 'a']);
  },
);
it.each(['a', 'b'] as const)('%sを掴む連動dragは左右移動と範囲端で負のB-Aを保持', (cursor) => {
  for (const delta of [-10, -0.1, 0.1, 10]) {
    const result = drag({ ...base, selected: { a: true, b: true }, cursor, delta });
    expect(result.b! - result.a!).toBeCloseTo(base.cursors.b - base.cursors.a, 12);
    for (const value of [result.a!, result.b!]) {
      expect(value).toBeGreaterThanOrEqual(4);
      expect(value).toBeLessThanOrEqual(6);
    }
  }
});

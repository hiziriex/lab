import { expect, it } from 'vitest';
import { isNumericalZero } from '../../src/lib/calculations/numeric';
import { formatVoltageError, formatRelativeError } from '../../src/lib/formatters/divider-error';

it.each([1e-12, 1, 1e12])('scale %s の IEEE-754 noise は zero、実誤差は保持', (scale) => {
  const targetVout = 3.3 * scale;
  const actualVout = 6 * scale * (22 / 40);
  expect(formatVoltageError({ actualVout, targetVout })).toBe('0 V');
  expect(formatRelativeError({ actualVout, targetVout })).toBe('0 %');
  expect(isNumericalZero({ value: 8 * Number.EPSILON * scale, scale })).toBe(false);
  expect(isNumericalZero({ value: -Number.EPSILON * scale, scale })).toBe(true);
});
it.each([
  [1, 5e-6, '<10 µV', '<0.001 %'],
  [3.3, 5e-6, '<10 µV', '<0.001 %'],
  [3.3, -5e-6, '<10 µV', '<0.001 %'],
  [3.3, 33e-6, '30 µV', '0.001 %'],
  [3.3, 87e-6, '90 µV', '0.002636 %'],
  [3.3, -87e-6, '-90 µV', '-0.002636 %'],
  [12, 50e-6, '<100 µV', '<0.001 %'],
  [12, 100e-6, '100 µV', '<0.001 %'],
  [3.3, -33e-6, '-30 µV', '-0.001 %'],
  [1, 20e-6, '20 µV', '0.002 %'],
])('目標 %s V、実誤差 %s V の表示', (targetVout, error, absolute, relative) => {
  const input = { targetVout, actualVout: targetVout + error };
  expect(formatVoltageError(input)).toBe(absolute);
  expect(formatRelativeError(input)).toBe(relative);
});
it('表示下限を超える非zeroは less-than 表示にしない', () => {
  expect(formatVoltageError({ targetVout: 1e-5, actualVout: 1e-5 + 1.01e-10 })).toBe('100 pV');
  expect(formatRelativeError({ targetVout: 1, actualVout: 1.0000101 })).toBe('0.00101 %');
});

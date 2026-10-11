import { it, expect } from 'vitest';
import { parseEngineeringValue, prefixes } from '../../src/lib/units/engineering';
import { formatEngineering } from '../../src/lib/formatters/engineering';
it.each([
  ['4.7', 4.7],
  ['1e3', 1000],
  ['2.2e-6', 2.2e-6],
  ['.5', 0.5],
])('数値 %s を解釈', (text, value) => {
  expect(parseEngineeringValue({ text: String(text), prefix: '' })).toEqual({ ok: true, value });
});
it.each(['4,7', '1,000', '4.7k', '0x10', 'Infinity', 'NaN', '1e', '1e999'])(
  '不正文字列 %s',
  (text) => {
    expect(parseEngineeringValue({ text, prefix: '' }).ok).toBe(false);
  },
);
it('全 SI 接頭辞を変換', () => {
  for (const [prefix, value] of Object.entries(prefixes))
    expect(parseEngineeringValue({ text: '1', prefix: prefix as keyof typeof prefixes })).toEqual({
      ok: true,
      value,
    });
});
it('必須・任意と制約', () => {
  expect(parseEngineeringValue({ text: '', prefix: '' }).ok).toBe(false);
  expect(parseEngineeringValue({ text: '', prefix: '', required: false })).toEqual({
    ok: true,
    value: undefined,
  });
  for (const constraints of [{ allowZero: false }, { min: 1 }])
    expect(parseEngineeringValue({ text: '0', prefix: '', ...constraints }).ok).toBe(false);
  expect(parseEngineeringValue({ text: '-1', prefix: '', allowNegative: false }).ok).toBe(false);
  expect(parseEngineeringValue({ text: '5', prefix: '', max: 4 }).ok).toBe(false);
  expect(parseEngineeringValue({ text: '5', prefix: '', step: 2 }).ok).toBe(false);
  expect(parseEngineeringValue({ text: '1e-320', prefix: 'a' }).ok).toBe(false);
});
it('表示だけを4桁へ丸める', () => {
  expect(formatEngineering(4700, 'Ω')).toBe('4.7 kΩ');
  expect(formatEngineering(0.00123456, 'A')).toBe('1.235 mA');
  expect(formatEngineering(999.99, 'Ω')).toBe('1 kΩ');
  expect(formatEngineering(0, 'V')).toBe('0 V');
  expect(formatEngineering(1e-24, 'A')).toContain('e-24');
});

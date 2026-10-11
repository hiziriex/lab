import type { CalculationResult } from '../calculations/types';
export const prefixes = {
  a: 1e-18,
  f: 1e-15,
  p: 1e-12,
  n: 1e-9,
  µ: 1e-6,
  m: 1e-3,
  '': 1,
  k: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
} as const;
export type Prefix = keyof typeof prefixes;
export type EngineeringValue = { text: string; prefix: Prefix };
export type Constraints = {
  required?: boolean;
  min?: number;
  max?: number;
  allowZero?: boolean;
  allowNegative?: boolean;
  step?: number;
};
export function parseEngineeringValue({
  text,
  prefix,
  unit = '',
  required = true,
  min,
  max,
  allowZero = true,
  allowNegative = true,
  step,
}: EngineeringValue & Constraints & { unit?: string }): CalculationResult<number | undefined> {
  const valueText = text.trim();
  const fail = (
    code: 'required' | 'invalid_number' | 'out_of_range',
    message: string,
  ): CalculationResult<number> => ({ ok: false, errors: [{ code, message }] });
  if (!valueText)
    return required ? fail('required', '値を入力してください') : { ok: true, value: undefined };
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(valueText))
    return fail('invalid_number', '数値として解釈できません');
  const value = Number(valueText) * prefixes[prefix];
  if (!Number.isFinite(value) || (Number(valueText) !== 0 && value === 0))
    return fail('out_of_range', '計算可能な数値の範囲を超えています');
  if ((!allowZero && value === 0) || (!allowNegative && value < 0))
    return fail(
      'out_of_range',
      `0 ${unit}${allowZero ? '以上' : 'より大きい値'}を入力してください`,
    );
  if (min !== undefined && value < min)
    return fail('out_of_range', `${min} ${unit}以上の値を入力してください`);
  if (max !== undefined && value > max)
    return fail('out_of_range', `${max} ${unit}以下の値を入力してください`);
  if (
    step !== undefined &&
    Math.abs((value - (min ?? 0)) / step - Math.round((value - (min ?? 0)) / step)) > 1e-9
  )
    return fail('out_of_range', `${step} ${unit}刻みで入力してください`);
  return { ok: true, value };
}

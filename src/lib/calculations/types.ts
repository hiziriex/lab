export type CalculationError = {
  code: 'required' | 'invalid_number' | 'out_of_range';
  field?: string;
  message: string;
};
export type CalculationResult<T> =
  { ok: true; value: T } | { ok: false; errors: CalculationError[] };

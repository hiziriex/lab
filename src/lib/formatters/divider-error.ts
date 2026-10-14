import { isNumericalZero } from '../calculations/numeric';
import { formatEngineering } from './engineering';

type VoltageError = { actualVout: number; targetVout: number };
function errorValue({ actualVout, targetVout }: VoltageError): number {
  const value = actualVout - targetVout;
  return isNumericalZero({ value, scale: Math.max(Math.abs(actualVout), Math.abs(targetVout)) })
    ? 0
    : value;
}

// 境界そのものに生じる減算 noise で「未満」表示へ落ちないようにする。
function belowDisplayLimit(input: VoltageError, value: number, limit: number): boolean {
  const difference = Math.abs(value) - limit;
  return (
    difference < 0 &&
    !isNumericalZero({
      value: difference,
      scale: Math.max(Math.abs(input.actualVout), Math.abs(input.targetVout)),
    })
  );
}

export function formatRelativeError(input: VoltageError): string {
  const value = errorValue(input);
  if (value === 0) return '0 %';
  const percent = (value / input.targetVout) * 100;
  if (belowDisplayLimit(input, value, input.targetVout * 1e-5)) return '<0.001 %';
  return `${Number(percent.toPrecision(4))} %`;
}

export function formatVoltageError(input: VoltageError): string {
  const value = errorValue(input);
  if (value === 0) return '0 V';
  // 対数で reference を求め、極小値の積による underflow を避ける。
  const resolution = 10 ** Math.floor(Math.log10(input.targetVout) - 5);
  if (resolution === 0) return formatEngineering(value, 'V');
  if (belowDisplayLimit(input, value, resolution)) return `<${formatEngineering(resolution, 'V')}`;
  return formatEngineering(Math.round(value / resolution) * resolution, 'V');
}

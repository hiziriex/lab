import type { SweepMode } from '../calculations/voltage-divider-sweep';
import { formatEngineering } from './engineering';
export function formatSweepValue(value: number, mode: SweepMode): string {
  return mode === 'output'
    ? formatEngineering(value, 'V')
    : `${value > 0 ? '+' : ''}${Number((value * 1000).toPrecision(4))} mV`;
}
export function formatSweepSlope(value: number | null, mode: SweepMode): string {
  if (value === null) return '—';
  return `${Number((value * (mode === 'comparison' ? 1000 : 1)).toPrecision(4))} ${mode === 'comparison' ? 'mV/V' : 'V/V'}`;
}

export function formatCursorInput(value: number | null): string {
  if (value === null) return '';
  return (Math.abs(value) >= 0.001 && Math.abs(value) < 1e6) || value === 0
    ? value.toFixed(4)
    : value.toExponential(3);
}

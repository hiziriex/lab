import { useEffect, useId, useState, type CSSProperties } from 'react';
import { Button } from '@radix-ui/themes';
import {
  calculateSweepReading,
  calculateSweepDelta,
  type SweepCandidate,
  type SweepDesign,
  type SweepMode,
} from '../../lib/calculations/voltage-divider-sweep';
import type { SweepCursors, SweepCursorSelection } from '../../lib/calculations/sweep-cursors';
import { cursorCssColor } from '../../lib/cursor-colors';
import { formatEngineering as fmt } from '../../lib/formatters/engineering';
import { formatSweepValue, formatSweepSlope, formatCursorInput } from '../../lib/formatters/sweep';
import styles from './DividerSweep.module.css';
function CursorVinInput({
  label,
  value,
  resetKey,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | null;
  resetKey: SweepCursors;
  min: number;
  max: number;
  onChange: (value: number | null) => void;
}) {
  const [text, setText] = useState(formatCursorInput(value));
  const [dirty, setDirty] = useState(false);
  const [touched, setTouched] = useState(false);
  const id = useId();
  useEffect(() => {
    setText(formatCursorInput(value));
    setDirty(false);
    setTouched(false);
  }, [value, resetKey]);
  const invalid =
    text !== '' && (!Number.isFinite(Number(text)) || Number(text) < min || Number(text) > max);
  const commit = () => {
    setTouched(true);
    if (invalid || !dirty) return;
    onChange(text === '' ? null : Number(text));
    setText(formatCursorInput(text === '' ? null : Number(text)));
    setDirty(false);
  };
  return (
    <div className={styles.cursorInput}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        step="any"
        min={min}
        max={max}
        value={text}
        aria-invalid={touched && invalid}
        aria-describedby={touched && invalid ? `${id}-error` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setDirty(true);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            setText(formatCursorInput(value));
            setDirty(false);
            setTouched(false);
          }
        }}
      />
      <span aria-hidden="true">V</span>
      {touched && invalid && (
        <span id={`${id}-error`} className={styles.cursorError}>
          範囲内のVinを入力してください
        </span>
      )}
    </div>
  );
}
export function SweepMeasurements({
  candidates,
  design,
  mode,
  cursors,
  selected,
  onSelectionChange,
  onChange,
  vinMin,
  vinMax,
}: {
  candidates: SweepCandidate[];
  design: SweepDesign;
  mode: SweepMode;
  cursors: SweepCursors;
  selected: SweepCursorSelection;
  onSelectionChange: (value: SweepCursorSelection) => void;
  onChange: (value: SweepCursors) => void;
  vinMin: number;
  vinMax: number;
}) {
  const comparison = mode === 'comparison';
  const readings = candidates.map((candidate) => {
    const a =
      cursors.a === null ? null : calculateSweepReading({ candidate, design, vin: cursors.a });
    const b =
      cursors.b === null ? null : calculateSweepReading({ candidate, design, vin: cursors.b });
    return { candidate, a, b, delta: a && b ? calculateSweepDelta({ a, b }) : null };
  });
  const output = readings[0];
  return (
    <aside className={styles.measurements} aria-label="カーソルと測定結果">
      <div className={styles.cursorToolbar} role="group" aria-label="カーソル操作">
        {(['a', 'b'] as const).map((key) => (
          <div
            key={key}
            className={styles.cursorRow}
            style={{ '--cursor-color': cursorCssColor(key) } as CSSProperties}
          >
            <Button
              highContrast
              variant="outline"
              className={styles.cursorToggle}
              aria-label={`${key.toUpperCase()}カーソルを選択`}
              aria-pressed={selected[key]}
              onClick={() => onSelectionChange({ ...selected, [key]: !selected[key] })}
            >
              {key.toUpperCase()}
            </Button>
            <CursorVinInput
              label={`${key.toUpperCase()}のVin (V)`}
              value={cursors[key]}
              resetKey={cursors}
              min={vinMin}
              max={vinMax}
              onChange={(value) => onChange({ ...cursors, [key]: value })}
            />
            <Button
              highContrast
              variant="ghost"
              aria-label={`${key.toUpperCase()}カーソルを削除`}
              onClick={() => onChange({ ...cursors, [key]: null })}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
      <div className={styles.cursorActions}>
        <Button
          highContrast
          size="1"
          variant="ghost"
          onClick={() => onChange({ a: null, b: null })}
          aria-label="両カーソルを削除"
        >
          Clear
        </Button>
      </div>
      <p id="cursor-help" className="sr-only">
        A/Bを選択してclick / tap、または線をdragして移動。両選択で連動。← →で移動、Shiftで微調整。
      </p>
      <div className={styles.results} aria-live="polite">
        {comparison ? (
          <>
            <p className={styles.deltaVin}>
              ΔVin (B − A) <output>{output?.delta ? fmt(output.delta.vin, 'V') : '—'}</output>
            </p>
            <table className={styles.comparisonResults}>
              <caption className="sr-only">候補比較の測定結果</caption>
              <thead>
                <tr>
                  <th scope="col">候補</th>
                  <th scope="col">A誤差</th>
                  <th scope="col">B誤差</th>
                  <th scope="col">ΔError</th>
                  <th scope="col">ΔError / ΔVin</th>
                </tr>
              </thead>
              <tbody>
                {readings.map(({ candidate, a, b, delta }) => (
                  <tr key={candidate.rank}>
                    <th scope="row">
                      #{candidate.rank}
                      <small>
                        {fmt(candidate.r1, 'Ω')} / {fmt(candidate.r2, 'Ω')}
                      </small>
                    </th>
                    <td>{a ? formatSweepValue(a.nominal.error, mode) : '—'}</td>
                    <td>{b ? formatSweepValue(b.nominal.error, mode) : '—'}</td>
                    <td>{delta ? formatSweepValue(delta.nominal.error, mode) : '—'}</td>
                    <td>{delta ? formatSweepSlope(delta.nominal.errorSlope, mode) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <table className={styles.outputResults}>
            <caption className="sr-only">出力特性の測定結果</caption>
            <thead>
              <tr>
                <th scope="col">点</th>
                <th scope="col">Vin</th>
                <th scope="col">Vout</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">A</th>
                <td>{output?.a ? fmt(output.a.vin, 'V') : '—'}</td>
                <td>{output?.a ? fmt(output.a.nominal.vout, 'V') : '—'}</td>
              </tr>
              <tr>
                <th scope="row">B</th>
                <td>{output?.b ? fmt(output.b.vin, 'V') : '—'}</td>
                <td>{output?.b ? fmt(output.b.nominal.vout, 'V') : '—'}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={2}>
                  ΔVin (B − A)
                </th>
                <td>{output?.delta ? fmt(output.delta.vin, 'V') : '—'}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={2}>
                  ΔVout
                </th>
                <td>{output?.delta ? fmt(output.delta.nominal.vout, 'V') : '—'}</td>
              </tr>
              <tr>
                <th scope="row" colSpan={2}>
                  ΔVout / ΔVin
                </th>
                <td>
                  {output?.delta ? formatSweepSlope(output.delta.nominal.outputSlope, mode) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </aside>
  );
}

import { Fragment, lazy, Suspense, useRef, useState } from 'react';
import { SegmentedControl } from '@radix-ui/themes';
import { EngineeringValueInput } from '../ui/EngineeringValueInput';
import { ToolBoundary } from '../ui/ToolBoundary';
import { parseEngineeringValue, type EngineeringValue } from '../../lib/units/engineering';
import {
  calculateVoltageDividerSweep,
  type SweepCandidate,
  type SweepMode,
} from '../../lib/calculations/voltage-divider-sweep';
import { candidateSeriesCssColor, candidateSeriesDashes } from '../../lib/candidate-colors';
import { formatEngineering as fmt } from '../../lib/formatters/engineering';
import { SweepMeasurements } from './SweepMeasurements';
import {
  calculateSweepCursorMove,
  calculateSweepCursorDrag,
  type SweepCursors,
  type SweepCursorSelection,
} from '../../lib/calculations/sweep-cursors';
import styles from './DividerSweep.module.css';
const SweepChart = lazy(() => import('../charts/DividerSweepChart'));
export type SweepReferences = { vin?: number; targetVout?: number };
function SweepContent({
  candidates,
  nominalVin,
  vin,
  targetVout,
  stale,
  active,
  selected,
  focused,
  onFocusCandidate,
  designTargetVout,
}: {
  candidates: SweepCandidate[];
  nominalVin: number;
  designTargetVout: number;
  selected: number[];
  focused: number;
  onFocusCandidate: (rank: number) => void;
  stale: boolean;
  active: boolean;
} & SweepReferences) {
  const hasPlacedA = useRef(false);
  const [mode, setMode] = useState<SweepMode>('output');
  const [cursors, setCursors] = useState<SweepCursors>({ a: null, b: null });
  const [cursorSelection, setCursorSelection] = useState<SweepCursorSelection>({
    a: true,
    b: false,
  });
  const design = { nominalVin, targetVout: designTargetVout };
  const displayed = candidates.filter((c) =>
    mode === 'output' ? c.rank === focused : selected.includes(c.rank),
  );
  const [range, setRange] = useState<Record<'vinMin' | 'vinMax', EngineeringValue>>(() => ({
    vinMin: { text: String(Number((nominalVin * 0.8).toPrecision(12))), prefix: '' },
    vinMax: {
      text: String(Math.min(Number.MAX_VALUE, Number((nominalVin * 1.2).toPrecision(12)))),
      prefix: '',
    },
  }));
  const [touched, setTouched] = useState({ vinMin: false, vinMax: false });
  const values = { vinMin: NaN, vinMax: NaN };
  const errors: Partial<Record<keyof typeof range, string>> = {};
  for (const name of ['vinMin', 'vinMax'] as const) {
    const parsed = parseEngineeringValue({ ...range[name], unit: 'V', allowNegative: false });
    if (parsed.ok) values[name] = parsed.value ?? NaN;
    else errors[name] = parsed.errors[0]?.message;
  }
  const sweep = calculateVoltageDividerSweep({ candidates: displayed, ...values });
  if (!sweep.ok)
    for (const error of sweep.errors) {
      if (error.field === 'vinMin' || error.field === 'vinMax')
        errors[error.field] ??= error.message;
    }
  const valid = Object.keys(errors).length === 0 && sweep.ok;
  return (
    <>
      <div className={styles.controls}>
        <SegmentedControl.Root
          aria-label="グラフ種別"
          value={mode}
          onValueChange={(value) => setMode(value as SweepMode)}
        >
          <SegmentedControl.Item value="output">出力特性</SegmentedControl.Item>
          <SegmentedControl.Item value="comparison">候補比較</SegmentedControl.Item>
        </SegmentedControl.Root>
        <div
          className={styles.range}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setTouched({ vinMin: true, vinMax: true });
            }
          }}
        >
          <span aria-hidden="true">Vin</span>
          {(['vinMin', 'vinMax'] as const).map((name) => (
            <Fragment key={name}>
              <div className={styles.rangeField}>
                <span id={`sweep-${name}-label`} className={styles.rangeLabel}>
                  {name === 'vinMin' ? 'Vin min' : 'Vin max'}
                </span>
                <EngineeringValueInput
                  label={name === 'vinMin' ? 'Vin min' : 'Vin max'}
                  labelledBy={`sweep-${name}-label`}
                  unit="V"
                  prefixes={['m', '', 'k']}
                  value={range[name]}
                  required
                  error={touched[name] ? errors[name] : undefined}
                  onBlur={() => setTouched((s) => ({ ...s, [name]: true }))}
                  onChange={(value) => {
                    setRange((s) => ({ ...s, [name]: value }));
                    hasPlacedA.current = false;
                    setCursors({ a: null, b: null });
                    setCursorSelection({ a: true, b: false });
                  }}
                />
              </div>
              {name === 'vinMin' && <span aria-hidden="true">～</span>}
            </Fragment>
          ))}
        </div>
        {mode === 'output' && (
          <label className={styles.focusSelect}>
            表示候補
            <select value={focused} onChange={(e) => onFocusCandidate(Number(e.target.value))}>
              {candidates.map((c) => (
                <option key={c.rank} value={c.rank}>
                  候補 {c.rank}: R1 {fmt(c.r1, 'Ω')} / R2 {fmt(c.r2, 'Ω')}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {stale && (
        <p role="status" className={styles.notice}>
          未更新の抵抗候補です。再計算で更新します。
        </p>
      )}
      {mode === 'comparison' && (
        <p className={styles.modeHint}>
          誤差 = 候補 − 理想（設計 {fmt(designTargetVout, 'V')} / {fmt(nominalVin, 'V')}）
        </p>
      )}
      {valid && vin !== undefined && (vin < values.vinMin || vin > values.vinMax) && (
        <p role="status">現在のVinはグラフの範囲外です。</p>
      )}
      {!valid ? (
        <p role="status">グラフの範囲を確認してください。0 V ≤ Vin min &lt; Vin max が必要です。</p>
      ) : displayed.length === 0 ? (
        <p role="status">候補表で比較する抵抗候補を選択してください。</p>
      ) : (
        sweep.ok && (
          <>
            <div className={styles.workspace}>
              <div className={styles.graphArea}>
                {active && (
                  <ToolBoundary>
                    <Suspense fallback={<p role="status">グラフを読み込み中…</p>}>
                      <SweepChart
                        series={sweep.value.series}
                        mode={mode}
                        design={design}
                        cursors={cursors}
                        selected={cursorSelection}
                        onDrag={(drag) => {
                          setCursors(calculateSweepCursorDrag({ ...drag, ...values }));
                          if (!(drag.selected.a && drag.selected.b))
                            setCursorSelection({ a: drag.cursor === 'a', b: drag.cursor === 'b' });
                        }}
                        onPlace={(value) => {
                          if (
                            !hasPlacedA.current &&
                            cursors.a === null &&
                            cursorSelection.a &&
                            !cursorSelection.b
                          )
                            setCursorSelection({ a: false, b: true });
                          if (cursorSelection.a) hasPlacedA.current = true;
                          setCursors((s) =>
                            calculateSweepCursorMove({
                              cursors: s,
                              selected: cursorSelection,
                              motion: { type: 'place', vin: value },
                              ...values,
                            }),
                          );
                        }}
                        onNudge={(delta) => {
                          if (cursorSelection.a) hasPlacedA.current = true;
                          setCursors((s) =>
                            calculateSweepCursorMove({
                              cursors: s,
                              selected: cursorSelection,
                              motion: { type: 'nudge', delta },
                              ...values,
                            }),
                          );
                        }}
                        vinMin={values.vinMin}
                        vinMax={values.vinMax}
                        vin={vin}
                        targetVout={targetVout}
                      />
                    </Suspense>
                  </ToolBoundary>
                )}
                {mode === 'comparison' && (
                  <ul className={styles.legend} aria-label="グラフの候補">
                    {sweep.value.series.map((s) => (
                      <li key={s.rank}>
                        <svg width="30" height="12" aria-hidden="true">
                          <line
                            x1="0"
                            y1="6"
                            x2="30"
                            y2="6"
                            stroke={candidateSeriesCssColor(s.rank)}
                            strokeWidth="3"
                            strokeDasharray={candidateSeriesDashes[s.rank - 1]?.join(' ')}
                          />
                        </svg>
                        候補 {s.rank}: R1 {fmt(s.r1, 'Ω')} / R2 {fmt(s.r2, 'Ω')}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <SweepMeasurements
                candidates={displayed}
                design={design}
                mode={mode}
                cursors={cursors}
                selected={cursorSelection}
                onSelectionChange={setCursorSelection}
                onChange={(next) => {
                  if (next.a !== null) hasPlacedA.current = true;
                  setCursors(next);
                }}
                {...values}
              />
            </div>
          </>
        )
      )}
    </>
  );
}
export function DividerSweep(
  props: Omit<Parameters<typeof SweepContent>[0], 'active'> & { revision: number },
) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  return (
    <section className={styles.panel} id="graph" aria-labelledby="graph-heading">
      <h2 id="graph-heading" className={styles.heading}>
        <button
          className={styles.header}
          aria-label={open ? 'グラフを閉じる' : 'グラフを表示'}
          aria-expanded={open}
          aria-controls="sweep-content"
          onClick={() => {
            setHasOpened(true);
            setOpen(!open);
          }}
        >
          <span>グラフ</span>
          <span>{open ? '閉じる −' : '表示 ＋'}</span>
        </button>
      </h2>
      <div id="sweep-content" hidden={!open} className={styles.content}>
        {hasOpened && <SweepContent key={props.revision} {...props} active={open} />}
      </div>
    </section>
  );
}

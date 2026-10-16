import { lazy, Suspense, useState } from 'react';
import { Button } from '@radix-ui/themes';
import { EngineeringValueInput } from '../ui/EngineeringValueInput';
import { ToolBoundary } from '../ui/ToolBoundary';
import { parseEngineeringValue, type EngineeringValue } from '../../lib/units/engineering';
import {
  calculateVoltageDividerSweep,
  type SweepCandidate,
} from '../../lib/calculations/voltage-divider-sweep';
import { candidateSeriesCssColor, candidateSeriesDashes } from '../../lib/candidate-colors';
import { formatEngineering as fmt } from '../../lib/formatters/engineering';
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
}: {
  candidates: SweepCandidate[];
  nominalVin: number;
  stale: boolean;
  active: boolean;
} & SweepReferences) {
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
  const sweep = calculateVoltageDividerSweep({ candidates, ...values });
  if (!sweep.ok)
    for (const error of sweep.errors) {
      if (error.field === 'vinMin' || error.field === 'vinMax')
        errors[error.field] ??= error.message;
    }
  const valid = Object.keys(errors).length === 0 && sweep.ok;
  return (
    <>
      <p className={styles.hint}>
        候補表で選択した抵抗の公称値を比較します。負荷電流・抵抗公差・温度変化は含みません。
      </p>
      {stale && (
        <p role="status">
          未更新の抵抗候補を使用しています。主入力を再計算すると候補と範囲が更新されます。
        </p>
      )}
      <div
        className={styles.range}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setTouched({ vinMin: true, vinMax: true });
          }
        }}
      >
        {(['vinMin', 'vinMax'] as const).map((name) => (
          <EngineeringValueInput
            key={name}
            label={name === 'vinMin' ? 'Vin min' : 'Vin max'}
            unit="V"
            prefixes={['m', '', 'k']}
            value={range[name]}
            required
            error={touched[name] ? errors[name] : undefined}
            onBlur={() => setTouched((s) => ({ ...s, [name]: true }))}
            onChange={(value) => setRange((s) => ({ ...s, [name]: value }))}
          />
        ))}
      </div>
      <p id="sweep-references" className={styles.hint}>
        現在のVin: {vin === undefined ? '入力を確認してください' : fmt(vin, 'V')}（縦破線） /
        目標Vout: {targetVout === undefined ? '入力を確認してください' : fmt(targetVout, 'V')}
        （横破線）
      </p>
      {valid && vin !== undefined && (vin < values.vinMin || vin > values.vinMax) && (
        <p role="status">現在のVinはグラフの範囲外です。</p>
      )}
      {!valid ? (
        <p role="status">グラフの範囲を確認してください。0 V ≤ Vin min &lt; Vin max が必要です。</p>
      ) : candidates.length === 0 ? (
        <p role="status">候補表で比較する抵抗候補を選択してください。</p>
      ) : (
        sweep.ok && (
          <>
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
            {active && (
              <ToolBoundary>
                <Suspense fallback={<p role="status">グラフを読み込み中…</p>}>
                  <SweepChart
                    series={sweep.value.series}
                    vinMin={values.vinMin}
                    vinMax={values.vinMax}
                    vin={vin}
                    targetVout={targetVout}
                  />
                </Suspense>
              </ToolBoundary>
            )}
            <details className={styles.numbers}>
              <summary>グラフの数値</summary>
              <div
                className={styles.tableScroll}
                tabIndex={0}
                role="region"
                aria-label="グラフの数値表（横スクロール可能）"
              >
                <table>
                  <caption>選択した候補のVout（範囲の両端）</caption>
                  <thead>
                    <tr>
                      <th scope="col">候補</th>
                      <th scope="col">Vin {fmt(values.vinMin, 'V')}</th>
                      <th scope="col">Vin {fmt(values.vinMax, 'V')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sweep.value.series.map((s) => (
                      <tr key={s.rank}>
                        <th scope="row">候補 {s.rank}</th>
                        {s.points.map((p, i) => (
                          <td key={i}>{fmt(p.vout, 'V')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
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
    <section id="graph" aria-labelledby="graph-heading">
      <h2 id="graph-heading">
        <span className={styles.number}>03</span> Vin–Voutグラフ
      </h2>
      <Button
        highContrast
        variant="soft"
        aria-expanded={open}
        aria-controls="sweep-content"
        onClick={() => {
          setHasOpened(true);
          setOpen(!open);
        }}
      >
        {open ? 'グラフを閉じる' : 'グラフを表示'}
      </Button>
      <div id="sweep-content" hidden={!open} className={styles.content}>
        {hasOpened && <SweepContent key={props.revision} {...props} active={open} />}
      </div>
    </section>
  );
}

import '@radix-ui/themes/styles.css';
import type { CSSProperties } from 'react';
import { candidateSeriesColors } from '../../lib/candidate-colors';
import { formatVoltageError, formatRelativeError } from '../../lib/formatters/divider-error';
import { Button, Checkbox, Badge, Spinner } from '@radix-ui/themes';
import { Calculator, RotateCcw, AlertTriangle } from 'lucide-react';
import { OptionalEngineeringValueInput } from '../ui/OptionalEngineeringValueInput';
import { EngineeringValueInput } from '../ui/EngineeringValueInput';
import { SystemTheme } from '../ui/SystemTheme';
import { ToolBoundary } from '../ui/ToolBoundary';
import { formatEngineering as fmt } from '../../lib/formatters/engineering';
import { withBase } from '../../lib/site';
import { useDividerState } from './divider-state';
import styles from './VoltageDivider.module.css';
function Divider() {
  const state = useDividerState();
  const { fields, setFields, touched, setTouched, errors, result } = state;
  return (
    <div className={styles.tool}>
      <section id="input" aria-labelledby="input-heading">
        <h2 id="input-heading">
          <span className={styles.number}>01</span> 回路と入力条件
        </h2>
        <div className={styles.inputLayout}>
          <figure className={styles.circuit}>
            <img
              src={withBase('circuits/voltage-divider.svg')}
              alt="Vin から上側抵抗 R1、下側抵抗 R2、GND の順に接続し、R1 と R2 の接点が Vout。分圧電流 Idiv は下向き。"
              width="220"
              height="250"
            />
            <figcaption>無負荷・公称値による分圧</figcaption>
          </figure>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              state.calculate();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                state.reveal();
                if (state.invalid) e.preventDefault();
              }
            }}
          >
            <fieldset disabled={state.busy} className={styles.fields}>
              <legend className="sr-only">分圧抵抗の入力条件</legend>
              {(['vin', 'targetVout'] as const).map((name) => (
                <EngineeringValueInput
                  key={name}
                  label={name === 'vin' ? '入力電圧 Vin' : '目標電圧 Vout'}
                  unit="V"
                  value={fields[name]}
                  prefixes={['m', '', 'k']}
                  required
                  error={touched[name] ? errors[name] : undefined}
                  onBlur={() => setTouched((s) => ({ ...s, [name]: true }))}
                  onChange={(value) => setFields((s) => ({ ...s, [name]: value }))}
                />
              ))}
              <OptionalEngineeringValueInput
                label="分圧電流 Idiv"
                optionLabel="分圧電流 Idiv を指定"
                enabled={fields.currentEnabled}
                onEnabledChange={(enabled) => setFields((s) => ({ ...s, currentEnabled: enabled }))}
                unit="A"
                value={fields.targetCurrent}
                prefixes={['µ', 'm', '']}
                required
                error={
                  fields.currentEnabled && touched.targetCurrent ? errors.targetCurrent : undefined
                }
                onBlur={() => setTouched((s) => ({ ...s, targetCurrent: true }))}
                onChange={(value) => setFields((s) => ({ ...s, targetCurrent: value }))}
              />
              <label className={styles.series}>
                抵抗系列
                <select
                  value={fields.series}
                  onChange={(e) =>
                    setFields((s) => ({ ...s, series: e.target.value as 'E12' | 'E24' }))
                  }
                >
                  <option>E12</option>
                  <option>E24</option>
                </select>
                <small>公差は計算に含みません</small>
              </label>
            </fieldset>
            <div className={styles.actions}>
              <Button highContrast type="submit" disabled={state.invalid || state.busy}>
                {state.busy ? <Spinner /> : <Calculator size={16} />}計算
              </Button>
              <Button
                highContrast
                type="button"
                variant="soft"
                disabled={state.busy}
                onClick={state.reset}
              >
                <RotateCcw size={16} />
                リセット
              </Button>
            </div>
            {state.invalid && (
              <p className={styles.error} role="status">
                <AlertTriangle size={16} />
                入力エラーがあります
              </p>
            )}
          </form>
        </div>
      </section>
      <section id="results" aria-labelledby="results-heading" aria-busy={state.busy}>
        <h2 id="results-heading">
          <span className={styles.number}>02</span> 抵抗候補 <Badge color="gray">上位 5 件</Badge>
        </h2>
        <div aria-live="polite">
          {state.stale ? (
            <p className={styles.stale}>
              <Badge color="amber">未更新</Badge> 入力値が変更されています。再計算してください
            </p>
          ) : (
            <p className={styles.hint}>目標電圧との誤差が小さい順。比較する候補を選択できます。</p>
          )}
        </div>
        {result.ok ? (
          <div
            className={styles.tableScroll}
            tabIndex={0}
            role="region"
            aria-label="抵抗候補表（横スクロール可能）"
          >
            <table key={state.revision} className={styles.table}>
              <caption className="sr-only">抵抗候補の電圧誤差、電流、消費電力</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">候補を比較</span>
                  </th>
                  {[
                    'R1',
                    'R2',
                    '実際の Vout',
                    '電圧誤差',
                    '誤差率',
                    '実際の Idiv',
                    'R1 電力',
                    'R2 電力',
                  ].map((text) => (
                    <th key={text} scope="col">
                      {text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.value.candidates.map((c) => (
                  <tr
                    key={c.rank}
                    data-selected={state.selected.includes(c.rank)}
                    style={
                      { '--candidate-color': candidateSeriesColors[c.rank - 1] } as CSSProperties
                    }
                  >
                    <td>
                      <Checkbox
                        className={styles.candidateCheckbox}
                        aria-label={`候補 ${c.rank} を比較`}
                        checked={state.selected.includes(c.rank)}
                        onCheckedChange={(checked) =>
                          state.setSelected((s) =>
                            checked ? [...s, c.rank] : s.filter((rank) => rank !== c.rank),
                          )
                        }
                      />
                    </td>
                    <td>{fmt(c.r1, 'Ω')}</td>
                    <td>{fmt(c.r2, 'Ω')}</td>
                    <td>{fmt(c.actualVout, 'V')}</td>
                    <td>
                      {formatVoltageError({
                        actualVout: c.actualVout,
                        targetVout: state.resultTargetVout,
                      })}
                    </td>
                    <td>
                      {formatRelativeError({
                        actualVout: c.actualVout,
                        targetVout: state.resultTargetVout,
                      })}
                    </td>
                    <td>{fmt(c.actualDividerCurrent, 'A')}</td>
                    <td>{fmt(c.r1Power, 'W')}</td>
                    <td>{fmt(c.r2Power, 'W')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p role="alert" className={styles.error}>
            {result.errors.map((e) => e.message).join(' ')}
          </p>
        )}
      </section>
    </div>
  );
}
export default function VoltageDivider() {
  return (
    <SystemTheme>
      <ToolBoundary>
        <Divider />
      </ToolBoundary>
    </SystemTheme>
  );
}

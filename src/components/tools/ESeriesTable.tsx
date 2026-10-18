import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@radix-ui/themes';
import { ArrowLeftRight, Check, Copy } from 'lucide-react';
import '@radix-ui/themes/styles.css';
import { SystemTheme } from '../ui/SystemTheme';
import { ToolBoundary } from '../ui/ToolBoundary';
import { E_SERIES, MAIN_SERIES, formatSeriesForCopy, type ESeriesName } from '../../lib/e-series';
import styles from './ESeriesTable.module.css';

function CopySeries({ name }: { name: ESeriesName }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    clearTimeout(timer.current);
    setBusy(true);
    try {
      await navigator.clipboard.writeText(formatSeriesForCopy(name));
      setState('copied');
      timer.current = setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('failed');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <IconButton
        className={styles.copy}
        variant="outline"
        size="2"
        disabled={busy}
        aria-label={`${name}をカンマ区切りでコピー`}
        title={`${name}をカンマ区切りでコピー`}
        onClick={() => void copy()}
      >
        {state === 'copied' ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Copy size={16} aria-hidden="true" />
        )}
      </IconButton>
      <span className={state === 'failed' ? styles.failure : 'sr-only'} role="status">
        {state === 'copied'
          ? `${name}をコピーしました`
          : state === 'failed'
            ? `${name}をコピーできませんでした。ブラウザのクリップボード権限を確認して再試行してください。`
            : ''}
      </span>
    </>
  );
}

function SeriesHeading({ name }: { name: ESeriesName }) {
  return (
    <div className={styles.heading}>
      <div>
        <strong>{name}</strong>
        <small>{E_SERIES[name].tolerance}</small>
      </div>
      <CopySeries name={name} />
    </div>
  );
}

function Tables() {
  return (
    <>
      <section aria-labelledby="comparison-title" className={styles.section}>
        <h2 id="comparison-title">E3〜E96 標準値の比較</h2>
        <p id="decade-note" className={styles.note}>
          表は1 decade分の標準値。必要な桁へ ×10ⁿ（nは整数）して使用します。
          E3〜E24は2桁、E48以降は3桁の整数表記です（47と470は桁を揃えると同じ値）。
        </p>
        <p id="comparison-note" className={styles.note}>
          E24の24行を基準に、各系列を昇順で配置しています。E48は1行2値、E96は1行4値です。ヘッダの公差は代表例です。
        </p>
        <p className={styles.scrollHint}>
          <ArrowLeftRight size={16} aria-hidden="true" />{' '}
          表が収まらない場合は左右にスクロールできます
        </p>
        <div
          className={styles.scroller}
          role="region"
          aria-label="E3からE96の比較表・スクロール領域"
          tabIndex={0}
        >
          <table
            className={styles.table}
            aria-describedby="decade-note comparison-note tolerance-note"
          >
            <caption className="sr-only">E3〜E96の標準値。E24を基準とする24行の比較表。</caption>
            <thead>
              <tr>
                {MAIN_SERIES.map((name) => (
                  <th
                    key={name}
                    id={`heading-${name}`}
                    scope="colgroup"
                    colSpan={name === 'E48' ? 2 : name === 'E96' ? 4 : 1}
                  >
                    <SeriesHeading name={name} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {E_SERIES.E24.values.map((value, row) => (
                <tr key={value} className={row % 4 === 0 ? styles.groupStart : undefined}>
                  {(['E3', 'E6', 'E12'] as const).map((name) => {
                    const span = name === 'E3' ? 8 : name === 'E6' ? 4 : 2;
                    return row % span === 0 ? (
                      <td
                        key={name}
                        headers={`heading-${name}`}
                        rowSpan={span}
                        className={`${styles.seriesEnd} ${styles.merged}`}
                        data-series={name}
                      >
                        {E_SERIES[name].values[row / span]}
                      </td>
                    ) : null;
                  })}
                  <td headers="heading-E24" className={styles.seriesEnd} data-series="E24">
                    {value}
                  </td>
                  {(['E48', 'E96'] as const).flatMap((name) => {
                    const columns = name === 'E48' ? 2 : 4;
                    return Array.from({ length: columns }, (_, column) => (
                      <td
                        key={`${name}-${column}`}
                        headers={`heading-${name}`}
                        data-series={name}
                        className={column === columns - 1 ? styles.seriesEnd : undefined}
                      >
                        {E_SERIES[name].values[row * columns + column]}
                      </td>
                    ));
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.note}>
          E3 ⊂ E6 ⊂ E12 ⊂ E24、E48 ⊂ E96 ⊂ E192。
          ただしE24はE48／E96の部分集合ではありません（例：27と274は別の値）。
        </p>
        <p id="tolerance-note" className={styles.note}>
          系列から部品の公差は確定しません。IEC
          60063の推奨対応ではE3は±20%より広い公差、E192は±1%より狭い公差です。実際の公差は部品の仕様を確認してください。
        </p>
        <p className={styles.note}>
          コピーアイコンは各系列を1以上10未満の値に揃え、カンマ＋スペース区切りでコピーします（例：1.0,
          1.1, …／1.00, 1.02, …）。
        </p>
      </section>
      <section aria-labelledby="e192-title" className={styles.section}>
        <h2 id="e192-title">E192 標準値一覧</h2>
        <p id="e192-note" className={styles.note}>
          192値を24行×8列で表示します。各行を左から右へ読み、次の行へ進みます。整数3桁表記で、太字はE96にも含まれる値です。
        </p>
        <div className={styles.standaloneHeading}>
          <SeriesHeading name="E192" />
        </div>
        <p className={styles.scrollHint}>
          <ArrowLeftRight size={16} aria-hidden="true" />{' '}
          表が収まらない場合は左右にスクロールできます
        </p>
        <div
          className={styles.scroller}
          role="region"
          aria-label="E192の表・スクロール領域"
          tabIndex={0}
        >
          <table
            className={`${styles.table} ${styles.e192}`}
            aria-describedby="decade-note e192-note tolerance-note"
          >
            <caption className="sr-only">E192の全192標準値</caption>
            <thead>
              <tr>
                {Array.from({ length: 8 }, (_, column) => (
                  <th scope="col" key={column}>
                    <span className="sr-only">E192 </span>
                    {column + 1}列目
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, row) => (
                <tr key={row} className={row % 4 === 0 ? styles.groupStart : undefined}>
                  {Array.from({ length: 8 }, (_, column) => {
                    const index = row * 8 + column;
                    const value = E_SERIES.E192.values[index];
                    return (
                      <td key={column}>{index % 2 === 0 ? <strong>{value}</strong> : value}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default function ESeriesTable() {
  return (
    <SystemTheme>
      <ToolBoundary>
        <Tables />
      </ToolBoundary>
    </SystemTheme>
  );
}

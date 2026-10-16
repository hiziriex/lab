import { useEffect, useRef } from 'react';
import { init, use as registerECharts, type EChartsCoreOption } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, MarkLineComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import type { DividerSweepSeries } from '../../lib/calculations/voltage-divider-sweep';
import {
  candidateSeriesColors,
  candidateSeriesDarkColors,
  candidateSeriesDashes,
} from '../../lib/candidate-colors';
import type { SweepReferences } from '../tools/DividerSweep';
import styles from './DividerSweepChart.module.css';
registerECharts([LineChart, GridComponent, MarkLineComponent, SVGRenderer]);
export default function DividerSweepChart({
  series,
  vinMin,
  vinMax,
  vin,
  targetVout,
}: {
  series: DividerSweepSeries[];
  vinMin: number;
  vinMax: number;
} & SweepReferences) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current!;
    const chart = init(element, undefined, { renderer: 'svg' });
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      const color = media.matches ? '#edeef0' : '#1c2024';
      const grid = media.matches ? '#43484e' : '#d9dde1';
      const maxOutput = Math.max(
        targetVout ?? 0,
        ...series.flatMap((s) => s.points.map((p) => p.vout)),
      );
      const magnitude = Math.max(Number.MIN_VALUE, 10 ** Math.floor(Math.log10(maxOutput || 1)));
      const axisMax = Math.min(Number.MAX_VALUE, Math.ceil(maxOutput / magnitude) * magnitude) || 1;
      const options: EChartsCoreOption = {
        animation: false,
        textStyle: { fontFamily: getComputedStyle(element).fontFamily, color },
        grid: { left: 60, right: 20, top: 35, bottom: 55 },
        xAxis: {
          type: 'value',
          name: 'Vin (V)',
          nameLocation: 'middle',
          nameGap: 30,
          min: vinMin,
          max: vinMax,
          splitNumber: 4,
          axisLabel: {
            color,
            formatter: (value: number) => String(Number(value.toPrecision(4))),
            hideOverlap: true,
          },
          axisLine: { lineStyle: { color } },
          splitLine: { lineStyle: { color: grid } },
        },
        yAxis: {
          type: 'value',
          name: 'Vout (V)',
          min: 0,
          max: axisMax,
          splitNumber: 4,
          axisLabel: {
            color,
            formatter: (value: number) => String(Number(value.toPrecision(4))),
            hideOverlap: true,
          },
          axisLine: { lineStyle: { color } },
          splitLine: { lineStyle: { color: grid } },
        },
        series: series.map((s, i) => ({
          id: `candidate-${s.rank}`,
          name: `候補 ${s.rank}`,
          type: 'line',
          data: s.points.map((p) => [p.vin, p.vout]),
          showSymbol: false,
          lineStyle: {
            width: 2.5,
            color: (media.matches ? candidateSeriesDarkColors : candidateSeriesColors)[s.rank - 1],
            type: candidateSeriesDashes[s.rank - 1] ?? 'solid',
          },
          ...(i === 0
            ? {
                markLine: {
                  silent: true,
                  symbol: 'none',
                  label: { show: false },
                  lineStyle: { color, type: 'dashed', width: 1.5 },
                  data: [
                    ...(vin !== undefined && vin >= vinMin && vin <= vinMax
                      ? [{ xAxis: vin, name: '現在のVin' }]
                      : []),
                    ...(targetVout !== undefined ? [{ yAxis: targetVout, name: '目標Vout' }] : []),
                  ],
                },
              }
            : {}),
        })),
      };
      chart.setOption(options, { notMerge: true });
    };
    update();
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element);
    media.addEventListener('change', update);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', update);
      chart.dispose();
    };
  }, [series, vinMin, vinMax, vin, targetVout]);
  return (
    <div
      role="img"
      aria-label="選択した抵抗候補のVin–Voutグラフ"
      aria-describedby="sweep-references"
    >
      <div ref={ref} className={styles.chart} aria-hidden="true" />
    </div>
  );
}

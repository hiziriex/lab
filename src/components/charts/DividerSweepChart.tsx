import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  init,
  use as registerECharts,
  type EChartsCoreOption,
  type EChartsType,
} from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  MarkLineComponent,
  AxisPointerComponent,
  TooltipComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import {
  calculateSweepReading,
  type SweepDesign,
  type SweepMode,
  type DividerSweepSeries,
} from '../../lib/calculations/voltage-divider-sweep';
import {
  candidateSeriesColors,
  candidateSeriesDarkColors,
  candidateSeriesDashes,
} from '../../lib/candidate-colors';
import type { SweepReferences } from '../tools/DividerSweep';
import {
  calculateSweepCursorStep,
  type SweepCursors,
  type SweepCursorSelection,
  type SweepCursorDrag,
} from '../../lib/calculations/sweep-cursors';
import { cursorColors } from '../../lib/cursor-colors';
import { formatEngineering as fmt } from '../../lib/formatters/engineering';
import { formatSweepValue } from '../../lib/formatters/sweep';
import styles from './DividerSweepChart.module.css';
registerECharts([
  LineChart,
  GridComponent,
  MarkLineComponent,
  AxisPointerComponent,
  TooltipComponent,
  SVGRenderer,
]);
export default function DividerSweepChart({
  series,
  vinMin,
  vinMax,
  vin,
  targetVout,
  mode,
  design,
  cursors,
  onPlace,
  onNudge,
  selected = { a: true, b: false },
  onDrag,
}: {
  series: DividerSweepSeries[];
  vinMin: number;
  vinMax: number;
  mode: SweepMode;
  design: SweepDesign;
  cursors: SweepCursors;
  selected?: SweepCursorSelection;
  onDrag?: (drag: SweepCursorDrag) => void;
  onPlace: (vin: number) => void;
  onNudge: (delta: number) => void;
} & SweepReferences) {
  const [hoverVin, setHoverVin] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<
    (SweepCursorDrag & { pointerId: number; startX: number; width: number }) | null
  >(null);
  const [dragging, setDragging] = useState(false);
  const dragMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    onDrag?.({ ...drag, delta: ((event.clientX - drag.startX) / drag.width) * (vinMax - vinMin) });
  };
  const chartRef = useRef<EChartsType | null>(null);
  useEffect(() => {
    const element = ref.current!;
    const chart = init(element, undefined, { renderer: 'svg' });
    chartRef.current = chart;
    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(element);
    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);
  useEffect(() => {
    const element = ref.current!;
    const chart = chartRef.current!;
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
        backgroundColor: media.matches ? '#101214' : '#fff',
        animation: false,
        tooltip: {
          trigger: 'axis',
          showContent: false,
          axisPointer: { type: 'cross', snap: false },
        },
        textStyle: { fontFamily: getComputedStyle(element).fontFamily, color },
        grid: { left: 60, right: 20, top: 35, bottom: 55 },
        xAxis: {
          type: 'value',
          name: 'Vin (V)',
          axisPointer: {
            show: true,
            snap: false,
            lineStyle: { color },
            label: { show: true, formatter: ({ value }: { value: number }) => fmt(value, 'V') },
          },
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
          axisPointer: {
            show: true,
            snap: false,
            lineStyle: { color },
            label: {
              show: true,
              formatter: ({ value }: { value: number }) =>
                mode === 'output' ? fmt(value, 'V') : `${Number(value.toPrecision(4))} mV`,
            },
          },
          name: mode === 'output' ? 'Vout (V)' : 'Vout誤差 [mV]',
          ...(mode === 'output' ? { min: 0, max: axisMax } : {}),
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
          data: s.points.map((p) => [
            p.vin,
            mode === 'output'
              ? p.vout
              : calculateSweepReading({ candidate: s, design, vin: p.vin }).nominal.error * 1000,
          ]),
          showSymbol: false,
          lineStyle: {
            width: 2.5,
            color: (media.matches ? candidateSeriesDarkColors : candidateSeriesColors)[s.rank - 1],
            type: mode === 'output' ? 'solid' : (candidateSeriesDashes[s.rank - 1] ?? 'solid'),
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
                      ? [
                          {
                            xAxis: vin,
                            name: '現在のVin',
                            label: {
                              show: true,
                              formatter: fmt(vin, 'V'),
                              position: 'insideEndBottom',
                              rotate: 0,
                              color,
                            },
                          },
                        ]
                      : []),
                    ...(mode === 'comparison'
                      ? [
                          {
                            yAxis: 0,
                            name: '0 mV',
                            label: {
                              show: true,
                              formatter: '0 mV',
                              position: 'insideEndTop',
                              color,
                            },
                            lineStyle: { type: 'solid', width: 2 },
                          },
                        ]
                      : targetVout !== undefined
                        ? [
                            {
                              yAxis: targetVout,
                              name: '目標Vout',
                              label: {
                                show: true,
                                formatter: `Target ${fmt(targetVout, 'V')}`,
                                position: 'insideEndTop',
                                color,
                              },
                            },
                          ]
                        : []),
                    ...(['a', 'b'] as const).flatMap((key) =>
                      cursors[key] === null
                        ? []
                        : [
                            {
                              xAxis: cursors[key],
                              name: key.toUpperCase(),
                              label: {
                                show: true,
                                formatter: key.toUpperCase(),
                                position: key === 'a' ? 'insideEndTop' : 'insideStartTop',
                                rotate: 0,
                                color: cursorColors[media.matches ? 'dark' : 'light'][key],
                              },
                              lineStyle: {
                                color: cursorColors[media.matches ? 'dark' : 'light'][key],
                                type: key === 'a' ? 'dashed' : 'dotted',
                                width: 2.5,
                              },
                            },
                          ],
                    ),
                  ],
                },
              }
            : {}),
        })),
      };
      chart.setOption(options, { notMerge: true });
    };
    update();
    const position = (event: { offsetX: number; offsetY: number }) => {
      const pixel = [event.offsetX, event.offsetY];
      if (!chart.containPixel({ gridIndex: 0 }, pixel)) return null;
      const coordinate = chart.convertFromPixel({ gridIndex: 0 }, pixel);
      return Math.max(vinMin, Math.min(vinMax, coordinate[0]!));
    };
    const move = (event: { offsetX: number; offsetY: number }) => {
      if (dragRef.current) return;
      const value = position(event);
      setHoverVin(value);
      if (value !== null && series[0]) {
        const reading = calculateSweepReading({ candidate: series[0], design, vin: value });
        const y = mode === 'output' ? reading.nominal.vout : reading.nominal.error * 1000;
        const pixel = chart.convertToPixel({ gridIndex: 0 }, [value, y]);
        chart.dispatchAction({ type: 'updateAxisPointer', x: event.offsetX, y: pixel[1] });
      } else chart.dispatchAction({ type: 'updateAxisPointer', currTrigger: 'leave' });
    };
    const click = (event: { offsetX: number; offsetY: number }) => {
      if (dragRef.current) return;
      const value = position(event);
      if (value !== null) {
        onPlace(value);
        if (matchMedia('(hover: none)').matches) setHoverVin(null);
      }
    };
    const leave = () => setHoverVin(null);
    const zr = chart.getZr();
    zr.on('mousemove', move);
    zr.on('click', click);
    zr.on('globalout', leave);
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
      zr.off('mousemove', move);
      zr.off('click', click);
      zr.off('globalout', leave);
    };
  }, [series, vinMin, vinMax, vin, targetVout, mode, design, cursors, onPlace]);
  return (
    <div className={styles.plot}>
      <div
        role="img"
        aria-label={mode === 'output' ? '注目候補のVin–Voutグラフ' : '比較候補のVin–Vout誤差グラフ'}
        aria-describedby="cursor-help"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            const step = calculateSweepCursorStep({ vinMin, vinMax, fine: e.shiftKey });
            onNudge(e.key === 'ArrowLeft' ? -step : step);
          }
        }}
      >
        <div ref={ref} className={styles.chart} aria-hidden="true" />
      </div>
      <div className={styles.handles} aria-hidden="true">
        {(['a', 'b'] as const).map((key) => {
          const value = cursors[key];
          if (value === null) return null;
          const other = cursors[key === 'a' ? 'b' : 'a'];
          // 近接時は中間点でhit areaを分割。同位置ではAを左、Bを右から掴める。
          const distance = other === null ? null : ((other - value) / (vinMax - vinMin)) * 100;
          const leftSide = distance !== null && (distance < 0 || (distance === 0 && key === 'b'));
          const rightSide = distance !== null && (distance > 0 || (distance === 0 && key === 'a'));
          return (
            <button
              key={key}
              type="button"
              tabIndex={-1}
              data-cursor-handle={key}
              className={styles.handle}
              style={{
                left: `${((value - vinMin) / (vinMax - vinMin)) * 100}%`,
                marginLeft: leftSide ? `max(-24px, ${distance / 2}%)` : '-24px',
                width:
                  leftSide || rightSide
                    ? `calc(24px + min(24px, ${Math.abs(distance) / 2}%))`
                    : '48px',
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onPointerDown={(event) => {
                if (!event.isPrimary || event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                const width = ref.current!.getBoundingClientRect().width - 80;
                if (width <= 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                  cursors,
                  selected,
                  cursor: key,
                  delta: 0,
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  width,
                };
                setDragging(true);
                setHoverVin(null);
                chartRef.current?.dispatchAction({
                  type: 'updateAxisPointer',
                  currTrigger: 'leave',
                });
                onDrag?.({ cursors, selected, cursor: key, delta: 0 });
              }}
              onPointerMove={dragMove}
              onPointerUp={(event) => {
                dragMove(event);
                dragRef.current = null;
                setDragging(false);
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  event.currentTarget.releasePointerCapture(event.pointerId);
              }}
              onPointerCancel={() => {
                dragRef.current = null;
                setDragging(false);
              }}
              onLostPointerCapture={() => {
                dragRef.current = null;
                setDragging(false);
              }}
            />
          );
        })}
      </div>
      {!dragging && hoverVin !== null && (
        <output className={styles.hover} aria-label="hover情報" aria-live="off">
          <strong>Vin {fmt(hoverVin, 'V')}</strong>
          {series.map((s) => {
            const reading = calculateSweepReading({ candidate: s, design, vin: hoverVin });
            return (
              <span key={s.rank} title={`R1 ${fmt(s.r1, 'Ω')} / R2 ${fmt(s.r2, 'Ω')}`}>
                {mode === 'comparison' ? `#${s.rank} Vout誤差` : 'Vout'}{' '}
                {formatSweepValue(
                  mode === 'output' ? reading.nominal.vout : reading.nominal.error,
                  mode,
                )}
              </span>
            );
          })}
        </output>
      )}
    </div>
  );
}

import { vi, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { candidateSeriesColors } from '../../src/lib/candidate-colors';
const chart = vi.hoisted(() => ({ setOption: vi.fn(), dispose: vi.fn(), resize: vi.fn() }));
vi.mock('echarts/core', () => ({ init: () => chart, use: vi.fn() }));
import DividerSweepChart from '../../src/components/charts/DividerSweepChart';
const series = [
  {
    rank: 3,
    r1: 1000,
    r2: 1000,
    points: [
      { vin: 4, vout: 2 },
      { vin: 6, vout: 3 },
    ],
  },
];
it('V軸・系列色・現在Vinとtarget基準線を設定し、unmountで破棄する', () => {
  const { unmount } = render(
    <DividerSweepChart series={series} vinMin={4} vinMax={6} vin={5} targetVout={3.3} />,
  );
  const options: unknown = chart.setOption.mock.lastCall?.[0];
  expect(options).toMatchObject({
    animation: false,
    xAxis: { name: 'Vin (V)', min: 4, max: 6 },
    yAxis: { name: 'Vout (V)', min: 0 },
    series: [
      {
        id: 'candidate-3',
        data: [
          [4, 2],
          [6, 3],
        ],
        lineStyle: { color: candidateSeriesColors[2] },
        markLine: {
          data: [
            { xAxis: 5, name: '現在のVin' },
            { yAxis: 3.3, name: '目標Vout' },
          ],
        },
      },
    ],
  });
  unmount();
  expect(chart.dispose).toHaveBeenCalled();
});
it('範囲外Vin・無効なtargetは基準線にしない', () => {
  render(<DividerSweepChart series={series} vinMin={4} vinMax={6} vin={10} />);
  const options: unknown = chart.setOption.mock.lastCall?.[0];
  expect(options).toMatchObject({ series: [{ markLine: { data: [] } }] });
});

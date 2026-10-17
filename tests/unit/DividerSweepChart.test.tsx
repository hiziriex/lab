import { vi, it, expect } from 'vitest';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { candidateSeriesColors } from '../../src/lib/candidate-colors';
const chart = vi.hoisted(() => ({
  init: vi.fn(),
  setOption: vi.fn(),
  dispose: vi.fn(),
  resize: vi.fn(),
  handlers: Object.create(null) as Record<
    string,
    (event: { offsetX: number; offsetY: number }) => void
  >,
  containPixel: vi.fn(() => true),
  convertToPixel: vi.fn(() => [100, 50]),
  convertFromPixel: vi.fn(() => [4.123456789, 2]),
  dispatchAction: vi.fn(),
  getZr: () => ({
    on: (name: string, handler: (event: { offsetX: number; offsetY: number }) => void) => {
      chart.handlers[name] = handler;
    },
    off: vi.fn(),
  }),
}));
vi.mock('echarts/core', () => ({
  init: () => {
    chart.init();
    return chart;
  },
  use: vi.fn(),
}));
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
    <DividerSweepChart
      series={series}
      mode="output"
      design={{ nominalVin: 5, targetVout: 3.3 }}
      cursors={{ a: null, b: null }}
      onNudge={() => {}}
      onPlace={() => {}}
      vinMin={4}
      vinMax={6}
      vin={5}
      targetVout={3.3}
    />,
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
        lineStyle: { color: candidateSeriesColors[2], type: 'solid' },
        markLine: {
          data: [
            { xAxis: 5, name: '現在のVin' },
            { yAxis: 3.3, name: '目標Vout' },
          ],
        },
      },
    ],
  });
  act(() => chart.handlers.mousemove!({ offsetX: 100, offsetY: 50 }));
  expect(screen.getByLabelText('hover情報')).toHaveTextContent('Vout 2.062 V');
  unmount();
  expect(chart.dispose).toHaveBeenCalled();
});
it('範囲外Vin・無効なtargetは基準線にしない', () => {
  render(
    <DividerSweepChart
      series={series}
      mode="output"
      design={{ nominalVin: 5, targetVout: 3.3 }}
      cursors={{ a: null, b: null }}
      onNudge={() => {}}
      onPlace={() => {}}
      vinMin={4}
      vinMax={6}
      vin={10}
    />,
  );
  const options: unknown = chart.setOption.mock.lastCall?.[0];
  expect(options).toMatchObject({ series: [{ markLine: { data: [] } }] });
});

it('比較seriesと0 mV線、A/B縦線、連続Vinのhover・click計算', () => {
  const onPlace = vi.fn();
  render(
    <DividerSweepChart
      series={series}
      mode="comparison"
      design={{ nominalVin: 5, targetVout: 3.3 }}
      cursors={{ a: 6, b: 4 }}
      onNudge={() => {}}
      onPlace={onPlace}
      vinMin={4}
      vinMax={6}
    />,
  );
  const options: unknown = chart.setOption.mock.lastCall?.[0];
  expect(options).toMatchObject({
    yAxis: { name: 'Vout誤差 [mV]' },
    series: [
      { markLine: { data: [{ yAxis: 0 }, { xAxis: 6, name: 'A' }, { xAxis: 4, name: 'B' }] } },
    ],
  });
  expect(options).toMatchObject({
    series: [
      {
        data: [
          [4, expect.closeTo(-640)],
          [6, expect.closeTo(-960)],
        ],
      },
    ],
  });
  act(() => chart.handlers.mousemove!({ offsetX: 100, offsetY: 50 }));
  expect(screen.getByLabelText('hover情報')).toHaveTextContent('Vin 4.123 V');
  expect(screen.getByLabelText('hover情報')).toHaveTextContent('#3 Vout誤差 -659.8 mV');
  act(() => chart.handlers.click!({ offsetX: 100, offsetY: 50 }));
  expect(onPlace).toHaveBeenCalledWith(4.123456789);
  act(() => chart.handlers.globalout!({ offsetX: 0, offsetY: 0 }));
  expect(screen.queryByLabelText('hover情報')).not.toBeInTheDocument();
  chart.containPixel.mockReturnValueOnce(false);
  act(() => chart.handlers.click!({ offsetX: 0, offsetY: 0 }));
  expect(onPlace).toHaveBeenCalledTimes(1);
});

it('A/Bや注目候補の更新は描画インスタンスを再生成しない', () => {
  const props = {
    series,
    mode: 'output' as const,
    design: { nominalVin: 5, targetVout: 3.3 },
    cursors: { a: null, b: null },
    onPlace: vi.fn(),
    onNudge: vi.fn(),
    vinMin: 4,
    vinMax: 6,
  };
  const { rerender } = render(<DividerSweepChart {...props} />);
  const count = chart.init.mock.calls.length;
  rerender(<DividerSweepChart {...props} cursors={{ a: 5.123456789, b: null }} />);
  expect(chart.init.mock.calls).toHaveLength(count);
});

it('graphのkeyboard移動はsnapせず範囲に応じた相対量を渡す', () => {
  const onNudge = vi.fn();
  render(
    <DividerSweepChart
      series={series}
      mode="output"
      design={{ nominalVin: 5, targetVout: 3.3 }}
      cursors={{ a: 5.600877192982456, b: 4.4 }}
      onPlace={vi.fn()}
      onNudge={onNudge}
      vinMin={4}
      vinMax={6}
    />,
  );
  fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowLeft' });
  expect(onNudge).toHaveBeenLastCalledWith(-0.02);
  fireEvent.keyDown(screen.getByRole('img'), { key: 'ArrowRight', shiftKey: true });
  expect(onNudge).toHaveBeenLastCalledWith(0.002);
});

it.each(['mouse', 'touch'])(
  '%s pointer captureでA/Bを連続dragし、hoverとclickを分離する',
  (pointerType) => {
    const onDrag = vi.fn();
    const onPlace = vi.fn();
    const { container } = render(
      <DividerSweepChart
        series={series}
        mode="output"
        design={{ nominalVin: 5, targetVout: 3.3 }}
        cursors={{ a: 5.6, b: 4.4 }}
        selected={{ a: true, b: true }}
        onDrag={onDrag}
        onPlace={onPlace}
        onNudge={() => {}}
        vinMin={4}
        vinMax={6}
      />,
    );
    const drawing = screen.getByRole('img').firstElementChild!;
    vi.spyOn(drawing, 'getBoundingClientRect').mockReturnValue({ width: 480 } as DOMRect);
    const pointer = (element: Element, type: string, x: number) => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, button: 0 });
      Object.assign(event, { pointerId: 1, pointerType, isPrimary: true });
      fireEvent(element, event);
    };
    for (const key of ['a', 'b']) {
      const handle = container.querySelector<HTMLButtonElement>(`[data-cursor-handle="${key}"]`)!;
      const capture = vi.fn();
      handle.setPointerCapture = capture;
      handle.hasPointerCapture = () => true;
      const release = vi.fn();
      handle.releasePointerCapture = release;
      act(() => chart.handlers.mousemove!({ offsetX: 100, offsetY: 50 }));
      pointer(handle, 'pointerdown', 100);
      expect(capture).toHaveBeenCalledWith(1);
      expect(screen.queryByLabelText('hover情報')).not.toBeInTheDocument();
      pointer(handle, 'pointermove', 80);
      expect(onDrag).toHaveBeenLastCalledWith(
        expect.objectContaining({ cursor: key, delta: -0.1, selected: { a: true, b: true } }),
      );
      pointer(handle, 'pointermove', 140);
      expect(onDrag).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: key, delta: 0.2 }));
      pointer(handle, 'pointerup', 140);
      expect(release).toHaveBeenCalledWith(1);
      fireEvent.click(handle);
      expect(onPlace).not.toHaveBeenCalled();
    }
    expect(chart.setOption.mock.lastCall?.[0]).toMatchObject({ backgroundColor: '#fff' });
  },
);

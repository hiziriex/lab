import { vi, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import VoltageDivider from '../../src/components/tools/VoltageDivider';
type ChartProps = ComponentProps<
  typeof import('../../src/components/charts/DividerSweepChart').default
>;
vi.mock('../../src/components/charts/DividerSweepChart', () => ({
  default: (props: ChartProps) => (
    <div data-testid="chart">
      {JSON.stringify(props)}
      <button onClick={() => props.onPlace(5.600877192982456)}>graph位置1</button>
      <button onClick={() => props.onPlace(4.4)}>graph位置2</button>
    </div>
  ),
}));
it('候補選択、現在の基準値、範囲、再計算とResetを連携する', async () => {
  const user = userEvent.setup();
  render(<VoltageDivider />);
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'グラフを表示' }));
  const chart = await screen.findByTestId('chart');
  expect(screen.queryByRole('list', { name: 'グラフの候補' })).not.toBeInTheDocument();
  expect(chart).toHaveTextContent('"vin":5');
  expect(chart).toHaveTextContent('"targetVout":3.3');
  const min = screen.getByRole('textbox', { name: 'Vin min' });
  const max = screen.getByRole('textbox', { name: 'Vin max' });
  expect(min).toHaveValue('4');
  expect(max).toHaveValue('6');
  await user.click(screen.getByRole('checkbox', { name: '候補 3 を比較' }));
  expect(screen.queryByRole('list', { name: 'グラフの候補' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('radio', { name: '候補比較' }));
  expect(
    within(screen.getByRole('list', { name: 'グラフの候補' })).getAllByRole('listitem'),
  ).toHaveLength(2);
  await user.clear(min);
  await user.type(min, '2');
  expect(screen.getByTestId('chart')).toHaveTextContent('"vinMin":2');
  await user.click(screen.getByRole('button', { name: 'グラフを閉じる' }));
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'グラフを表示' }));
  expect(min).toHaveValue('2');
  const vin = screen.getByRole('textbox', { name: '入力電圧 Vin' });
  await user.clear(vin);
  await user.type(vin, '10');
  expect(screen.getByTestId('chart')).toHaveTextContent('"vin":10');
  expect(screen.getByText('現在のVinはグラフの範囲外です。')).toBeVisible();
  expect(screen.getByText(/未更新の抵抗候補/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: '計算' }));
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Vin min' })).toHaveValue('8'));
  expect(screen.getByRole('textbox', { name: 'Vin max' })).toHaveValue('12');
  await user.click(screen.getByRole('button', { name: 'リセット' }));
  expect(screen.getByRole('textbox', { name: 'Vin min' })).toHaveValue('4');
  await user.click(screen.getByRole('radio', { name: '候補比較' }));
  await user.click(screen.getByRole('checkbox', { name: '候補 1 を比較' }));
  expect(screen.getByText(/候補表で比較する抵抗候補を選択/)).toBeVisible();
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
});
it('範囲エラーはblur / Enterで表示し、主計算を妨げない', async () => {
  const user = userEvent.setup();
  render(<VoltageDivider />);
  await user.click(screen.getByRole('button', { name: 'グラフを表示' }));
  await screen.findByTestId('chart');
  const min = screen.getByRole('textbox', { name: 'Vin min' });
  const max = screen.getByRole('textbox', { name: 'Vin max' });
  await user.clear(min);
  await user.type(min, '-1');
  expect(min).toHaveAttribute('aria-invalid', 'false');
  expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  await user.tab();
  expect(min).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('button', { name: '計算' })).toBeEnabled();
  await user.clear(min);
  await user.type(min, '4');
  await user.clear(max);
  await user.type(max, '4');
  await user.keyboard('{Enter}');
  expect(max).toHaveAttribute('aria-invalid', 'true');
  await user.clear(max);
  await user.type(max, 'bad');
  await user.tab();
  expect(screen.getByText('⚠ 数値として解釈できません')).toBeVisible();
  await user.clear(max);
  await user.type(max, '6');
  expect(await screen.findByTestId('chart')).toBeInTheDocument();
});

it('注目候補・checkboxの独立性とkeyboardカーソル・解除・同一Vin', async () => {
  const user = userEvent.setup();
  render(<VoltageDivider />);
  await user.click(screen.getByRole('button', { name: 'グラフを表示' }));
  await screen.findByTestId('chart');
  const select = screen.getByRole('combobox', { name: '表示候補' });
  await user.selectOptions(select, '3');
  expect(screen.getByTestId('chart')).toHaveTextContent('"rank":3');
  expect(screen.queryByRole('list')).not.toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: '候補 3 を比較' })).not.toBeChecked();
  await user.click(screen.getByRole('checkbox', { name: '候補 2 を比較' }));
  expect(select).toHaveValue('3');
  await user.click(
    screen.getByRole('checkbox', { name: '候補 4 を比較' }).closest('tr')!.children[1]!,
  );
  expect(select).toHaveValue('4');
  expect(screen.getByRole('checkbox', { name: '候補 4 を比較' })).not.toBeChecked();
  await user.type(screen.getByRole('spinbutton', { name: 'AのVin (V)' }), '6{Enter}');
  await user.type(screen.getByRole('spinbutton', { name: 'BのVin (V)' }), '4{Enter}');
  expect(screen.getByText('-2 V')).toBeVisible();
  expect(screen.getByText('ΔVout / ΔVin')).toBeVisible();
  await user.click(screen.getByRole('radio', { name: '候補比較' }));
  expect(screen.getByText('ΔError / ΔVin')).toBeVisible();
  expect(screen.queryByRole('combobox', { name: '表示候補' })).not.toBeInTheDocument();
  expect(screen.queryByText('ΔVout')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Aカーソルを削除' }));
  expect(screen.getByRole('spinbutton', { name: 'AのVin (V)' })).toHaveValue(null);
  await user.type(screen.getByRole('spinbutton', { name: 'AのVin (V)' }), '4{Enter}');
  expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  await user.click(screen.getByRole('button', { name: '両カーソルを削除' }));
  expect(screen.getByRole('spinbutton', { name: 'BのVin (V)' })).toHaveValue(null);
});

it('カーソルVinを複数桁・小数でkeyboard入力し、範囲外の入力途中を保持する', async () => {
  const user = userEvent.setup();
  render(<VoltageDivider />);
  await user.click(screen.getByRole('button', { name: 'グラフを表示' }));
  await screen.findByTestId('chart');
  const max = screen.getByRole('textbox', { name: 'Vin max' });
  await user.clear(max);
  await user.type(max, '20');
  const min = screen.getByRole('textbox', { name: 'Vin min' });
  await user.clear(min);
  await user.type(min, '10');
  const a = screen.getByRole('spinbutton', { name: 'AのVin (V)' });
  await user.type(a, '1{Enter}');
  expect(a).toHaveValue(1);
  expect(a).toHaveAttribute('aria-invalid', 'true');
  await user.type(a, '5.5{Enter}');
  expect(a).toHaveValue(15.5);
  expect(a).toHaveAttribute('aria-invalid', 'false');
  await user.click(screen.getByRole('button', { name: 'Aカーソルを削除' }));
  expect(a).toHaveValue(null);
});

it('cursor toggleと連動移動、formatのfocus/blurで内部値を丸めない', async () => {
  const user = userEvent.setup();
  render(<VoltageDivider />);
  await user.click(screen.getByRole('button', { name: 'グラフを表示' }));
  await screen.findByTestId('chart');
  expect(screen.queryByText('グラフの数値')).not.toBeInTheDocument();
  const aSelect = screen.getByRole('button', { name: 'Aカーソルを選択' });
  const bSelect = screen.getByRole('button', { name: 'Bカーソルを選択' });
  await user.click(screen.getByRole('button', { name: 'graph位置1' }));
  const a = screen.getByRole('spinbutton', { name: 'AのVin (V)' });
  expect(a).toHaveValue(5.6009);
  await user.click(a);
  await user.tab();
  expect(screen.getByTestId('chart')).toHaveTextContent('5.600877192982456');
  expect(aSelect).toHaveAttribute('aria-pressed', 'false');
  await user.click(screen.getByRole('button', { name: 'graph位置2' }));
  expect(screen.getByRole('spinbutton', { name: 'BのVin (V)' })).toHaveValue(4.4);
  await user.click(aSelect);
  await user.click(screen.getByRole('button', { name: 'graph位置2' }));
  expect(a).toHaveValue(5.2009);
  expect(screen.getByRole('spinbutton', { name: 'BのVin (V)' })).toHaveValue(4);
  await user.click(aSelect);
  await user.click(bSelect);
  await user.click(screen.getByRole('button', { name: 'graph位置1' }));
  expect(a).toHaveValue(5.2009);
});

it('初回A配置だけBへ交替し、既存A・B移動と削除では選択を維持する', async () => {
  const user = userEvent.setup();
  render(<VoltageDivider />);
  await user.click(screen.getByRole('button', { name: 'グラフを表示' }));
  await screen.findByTestId('chart');
  const a = screen.getByRole('button', { name: 'Aカーソルを選択' });
  const b = screen.getByRole('button', { name: 'Bカーソルを選択' });
  await user.click(screen.getByRole('button', { name: 'graph位置1' }));
  expect(a).toHaveAttribute('aria-pressed', 'false');
  expect(b).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: 'graph位置2' }));
  expect(b).toHaveAttribute('aria-pressed', 'true');
  await user.click(b);
  await user.click(a);
  await user.click(screen.getByRole('button', { name: 'graph位置2' }));
  expect(a).toHaveAttribute('aria-pressed', 'true');
  expect(b).toHaveAttribute('aria-pressed', 'false');
  await user.click(screen.getByRole('button', { name: 'Aカーソルを削除' }));
  expect(a).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: 'graph位置1' }));
  expect(a).toHaveAttribute('aria-pressed', 'true');
  expect(b).toHaveAttribute('aria-pressed', 'false');
  expect(screen.queryByText('Aを移動')).not.toBeInTheDocument();
});

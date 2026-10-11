import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EngineeringValueInput } from '../../src/components/ui/EngineeringValueInput';
import VoltageDivider from '../../src/components/tools/VoltageDivider';
it('単位変更は numeric text を維持', async () => {
  const onChange = vi.fn();
  render(
    <EngineeringValueInput
      label="抵抗"
      unit="Ω"
      value={{ text: '4.7', prefix: 'k' }}
      prefixes={['', 'k']}
      onChange={onChange}
    />,
  );
  await userEvent.selectOptions(screen.getByRole('combobox'), '');
  expect(onChange).toHaveBeenCalledWith({ text: '4.7', prefix: '' });
});
it('blur でエラーを表示し、OFF の電流は計算を妨げない', async () => {
  const user = userEvent.setup();
  render(<VoltageDivider />);
  const input = screen.getByRole('textbox', { name: '分圧電流 Idiv' });
  await user.clear(input);
  expect(screen.queryByText('⚠ 値を入力してください')).not.toBeInTheDocument();
  await user.tab();
  expect(screen.getByText('⚠ 値を入力してください')).toBeVisible();
  expect(screen.getByRole('button', { name: '計算' })).toBeDisabled();
  await user.click(screen.getByRole('checkbox', { name: '分圧電流を指定' }));
  expect(input).toBeDisabled();
  expect(screen.getByRole('button', { name: '計算' })).toBeEnabled();
});

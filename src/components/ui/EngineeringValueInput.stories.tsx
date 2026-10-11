import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { EngineeringValueInput } from './EngineeringValueInput';
const meta = {
  title: '共通UI/EngineeringValueInput',
  component: EngineeringValueInput,
  args: {
    label: '抵抗値',
    unit: 'Ω',
    value: { text: '4.7', prefix: 'k' },
    prefixes: ['', 'k', 'M'],
    onChange: () => undefined,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <EngineeringValueInput {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof EngineeringValueInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Normal: Story = {};
export const Error: Story = { args: { error: '0 Ωより大きい値を入力してください' } };
export const Disabled: Story = { args: { disabled: true } };
export const Current: Story = {
  args: { label: '電流', unit: 'A', prefixes: ['µ', 'm', ''], value: { text: '1', prefix: 'm' } },
};
export const Focus: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector('input')?.focus();
  },
};

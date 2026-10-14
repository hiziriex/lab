import { Checkbox } from '@radix-ui/themes';
import { useId } from 'react';
import { EngineeringValueInput, type EngineeringValueInputProps } from './EngineeringValueInput';
import styles from './OptionalEngineeringValueInput.module.css';

type Props = Omit<EngineeringValueInputProps, 'disabled' | 'labelledBy'> & {
  optionLabel: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
};

// オプション名と有効化操作を一行にまとめ、その直下へ既存の値入力を配置する。
export function OptionalEngineeringValueInput({
  optionLabel,
  enabled,
  onEnabledChange,
  ...inputProps
}: Props) {
  const labelId = useId();
  return (
    <div className={styles.option} role="group" aria-labelledby={labelId}>
      <label className={styles.toggle}>
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => onEnabledChange(checked === true)}
        />
        <span id={labelId}>{optionLabel}</span>
      </label>
      <EngineeringValueInput {...inputProps} labelledBy={labelId} disabled={!enabled} />
    </div>
  );
}

import { TextField } from '@radix-ui/themes';
import { useId } from 'react';
import type { Constraints, EngineeringValue, Prefix } from '../../lib/units/engineering';
import styles from './EngineeringValueInput.module.css';
export type EngineeringValueInputProps = Constraints & {
  label: string;
  labelledBy?: string;
  unit: string;
  value: EngineeringValue;
  prefixes: Prefix[];
  onChange: (value: EngineeringValue) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
};
export function EngineeringValueInput({
  label,
  labelledBy,
  unit,
  value,
  prefixes,
  onChange,
  onBlur,
  error,
  disabled,
  required,
  min,
  max,
  step,
}: EngineeringValueInputProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      {!labelledBy && <label htmlFor={id}>{label}</label>}
      <div className={styles.controls}>
        <TextField.Root
          id={id}
          aria-labelledby={labelledBy}
          type="text"
          inputMode="decimal"
          value={value.text}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          data-min={min}
          data-max={max}
          data-step={step}
          onBlur={onBlur}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
        />
        <select
          aria-label={`${label} の単位`}
          value={value.prefix}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(e) => onChange({ ...value, prefix: e.target.value as Prefix })}
        >
          {prefixes.map((prefix) => (
            <option key={prefix} value={prefix}>
              {prefix}
              {unit}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p className={styles.error} id={`${id}-error`}>
          ⚠ {error}
        </p>
      )}
    </div>
  );
}

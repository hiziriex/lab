import { useState } from 'react';
import {
  calculateVoltageDivider,
  validateDivider,
  type DividerInput,
} from '../../lib/calculations/voltage-divider';
import { parseEngineeringValue, type EngineeringValue } from '../../lib/units/engineering';
export type DividerFields = {
  vin: EngineeringValue;
  targetVout: EngineeringValue;
  targetCurrent: EngineeringValue;
  currentEnabled: boolean;
  series: 'E12' | 'E24';
};
export const defaultFields: DividerFields = {
  vin: { text: '5', prefix: '' },
  targetVout: { text: '3.3', prefix: '' },
  targetCurrent: { text: '1', prefix: 'm' },
  currentEnabled: true,
  series: 'E12',
};
export function readFields(fields: DividerFields) {
  const errors: Partial<Record<keyof DividerFields, string>> = {};
  const input: DividerInput = {
    vin: NaN,
    targetVout: NaN,
    targetCurrent: NaN,
    currentEnabled: fields.currentEnabled,
    series: fields.series,
  };
  for (const name of ['vin', 'targetVout', 'targetCurrent'] as const) {
    if (name === 'targetCurrent' && !fields.currentEnabled) continue;
    const parsed = parseEngineeringValue({
      ...fields[name],
      unit: name === 'targetCurrent' ? 'A' : 'V',
      allowZero: false,
      allowNegative: false,
    });
    if (parsed.ok) input[name] = parsed.value ?? NaN;
    else errors[name] = parsed.errors[0]?.message;
  }
  for (const error of validateDivider(input))
    if (error.field) {
      const key = error.field as keyof DividerFields;
      errors[key] ??= error.message;
    }
  return { input, errors };
}
// 主入力と将来の ParameterPanel は、この状態を親 Island から共有する。
export function useDividerState() {
  const [fields, setFields] = useState(defaultFields);
  const [lastFields, setLastFields] = useState(defaultFields);
  const [result, setResult] = useState(() =>
    calculateVoltageDivider(readFields(defaultFields).input),
  );
  const [touched, setTouched] = useState<Partial<Record<keyof DividerFields, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState([1]);
  const { input, errors } = readFields(fields);
  const invalid = Object.keys(errors).length > 0;
  const reveal = () => setTouched({ vin: true, targetVout: true, targetCurrent: true });
  function calculate() {
    reveal();
    if (invalid || busy) return;
    setBusy(true);
    window.setTimeout(() => {
      setResult(calculateVoltageDivider(input));
      setLastFields(fields);
      setSelected([1]);
      setRevision((n) => n + 1);
      setBusy(false);
    }, 0);
  }
  function reset() {
    setFields(defaultFields);
    setLastFields(defaultFields);
    setResult(calculateVoltageDivider(readFields(defaultFields).input));
    setTouched({});
    setSelected([1]);
    setRevision((n) => n + 1);
  }
  return {
    fields,
    setFields,
    result,
    resultTargetVout: readFields(lastFields).input.targetVout,
    touched,
    setTouched,
    busy,
    revision,
    selected,
    setSelected,
    errors,
    invalid,
    stale: JSON.stringify(fields) !== JSON.stringify(lastFields),
    calculate,
    reset,
    reveal,
  };
}

export const defaultInput = {
  vin: 5,
  targetVout: 3.3,
  currentEnabled: true,
  targetCurrent: 0.001,
  series: 'E12' as const,
};
export const invalidNumbers = [0, -1, NaN, Infinity, -Infinity];

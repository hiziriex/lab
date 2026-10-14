// 分圧の比率・乗算・減算で生じる数 ULP の丸め誤差だけを許容する。
// 固定の絶対閾値や 1 V の下限を置かず、小さい電圧でも同じ相対精度を保つ。
export function isNumericalZero({ value, scale }: { value: number; scale: number }): boolean {
  return Math.abs(value) <= 4 * Number.EPSILON * Math.abs(scale);
}

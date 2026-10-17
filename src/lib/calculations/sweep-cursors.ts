export type SweepCursors = { a: number | null; b: number | null };
export type SweepCursorSelection = { a: boolean; b: boolean };
export type SweepCursorMotion = { type: 'place'; vin: number } | { type: 'nudge'; delta: number };
// 両選択の絶対指定はA基準。欠けたcursorは指定位置に初期化する。
export function calculateSweepCursorMove({
  cursors,
  selected,
  motion,
  vinMin,
  vinMax,
}: {
  cursors: SweepCursors;
  selected: SweepCursorSelection;
  motion: SweepCursorMotion;
  vinMin: number;
  vinMax: number;
}): SweepCursors {
  if (
    (!selected.a && !selected.b) ||
    !Number.isFinite(vinMin) ||
    !Number.isFinite(vinMax) ||
    vinMin >= vinMax
  )
    return cursors;
  const anchor = (selected.a ? cursors.a : cursors.b) ?? vinMin + (vinMax - vinMin) / 2;
  const target = motion.type === 'place' ? motion.vin : anchor + motion.delta;
  if (!Number.isFinite(target)) return cursors;
  if (selected.a && selected.b && cursors.a !== null && cursors.b !== null) {
    const shift = Math.max(
      vinMin - Math.min(cursors.a, cursors.b),
      Math.min(vinMax - Math.max(cursors.a, cursors.b), target - cursors.a),
    );
    return { a: cursors.a + shift, b: cursors.b + shift };
  }
  const position = Math.max(vinMin, Math.min(vinMax, target));
  return { a: selected.a ? position : cursors.a, b: selected.b ? position : cursors.b };
}
export function calculateSweepCursorStep({
  vinMin,
  vinMax,
  fine,
}: {
  vinMin: number;
  vinMax: number;
  fine: boolean;
}) {
  return (vinMax - vinMin) * (fine ? 0.001 : 0.01);
}

export type SweepCursorDrag = {
  cursors: SweepCursors;
  selected: SweepCursorSelection;
  cursor: 'a' | 'b';
  delta: number;
};
// drag開始時の値から毎回計算し、掴んだ位置のoffsetとB−Aを保持する。
export function calculateSweepCursorDrag({
  cursors,
  selected,
  cursor,
  delta,
  vinMin,
  vinMax,
}: SweepCursorDrag & { vinMin: number; vinMax: number }) {
  return calculateSweepCursorMove({
    cursors,
    selected: selected.a && selected.b ? selected : { a: cursor === 'a', b: cursor === 'b' },
    motion: { type: 'nudge', delta },
    vinMin,
    vinMax,
  });
}

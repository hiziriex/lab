import { describe, expect, it } from 'vitest';
import {
  E_SERIES,
  MAIN_SERIES,
  formatSeriesForCopy,
  getComparisonGroups,
} from '../../src/lib/e-series';

describe('IEC 60063の標準値', () => {
  it.each(Object.entries(E_SERIES))('%sは件数・桁・昇順・重複なしを満たす', (name, series) => {
    expect(series.values).toHaveLength(Number(name.slice(1)));
    expect(new Set(series.values).size).toBe(series.values.length);
    expect([...series.values].sort((a, b) => a - b)).toEqual(series.values);
    expect(
      series.values.every((v) => Number.isInteger(v) && String(v).length === series.digits),
    ).toBe(true);
  });

  it('規格の例外値・境界値を保持し、異なる数列を混同しない', () => {
    expect(E_SERIES.E3.values).toEqual([10, 22, 47]);
    expect(E_SERIES.E24.values).toEqual([
      10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82,
      91,
    ]);
    expect(E_SERIES.E48.values.slice(0, 4)).toEqual([100, 105, 110, 115]);
    expect(E_SERIES.E96.values.slice(-4)).toEqual([909, 931, 953, 976]);
    expect(E_SERIES.E192.values.at(-1)).toBe(988);
    expect(E_SERIES.E96.values).not.toContain(270);
  });

  it.each([
    ['E3', 'E6'],
    ['E6', 'E12'],
    ['E12', 'E24'],
    ['E48', 'E96'],
    ['E96', 'E192'],
  ] as const)('%sは%sに含まれる', (small, large) => {
    expect(
      E_SERIES[small].values.every((v) => E_SERIES[large].values.some((other) => v === other)),
    ).toBe(true);
  });

  it.each([...MAIN_SERIES, 'E192'] as const)(
    '%sのコピー値は正しいdecadeと有効数字で全値を含む',
    (name) => {
      const values = formatSeriesForCopy(name).split(', ');
      const series = E_SERIES[name];
      expect(values).toHaveLength(series.values.length);
      expect(values.every((v) => new RegExp(`^[1-9]\\.\\d{${series.digits - 1}}$`).test(v))).toBe(
        true,
      );
      expect(values.map(Number)).toEqual(series.values.map((v) => v / 10 ** (series.digits - 1)));
    },
  );

  it('E24コピーは指定された文字列と一致する', () => {
    expect(formatSeriesForCopy('E24')).toBe(
      '1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1',
    );
  });

  it('主表は全値を1回ずつ配置し、一致値を同じグループに揃える', () => {
    const groups = getComparisonGroups();
    expect(groups).toHaveLength(24);
    for (const name of ['E48', 'E96'] as const) {
      expect(groups.flatMap((g) => g[name])).toEqual(E_SERIES[name].values);
      for (const group of groups) {
        const exact = group.anchor * 10;
        if (E_SERIES[name].values.some((v) => v === exact)) expect(group[name]).toContain(exact);
        for (const value of group[name]) {
          const distance = Math.abs(Math.log(value / exact));
          expect(
            groups.every(
              (other) => distance <= Math.abs(Math.log(value / (other.anchor * 10))) + 1e-12,
            ),
          ).toBe(true);
        }
      }
    }
    expect(Math.max(...groups.map((g) => g.E48.length))).toBe(3);
    expect(Math.max(...groups.map((g) => g.E96.length))).toBe(6);
  });
});

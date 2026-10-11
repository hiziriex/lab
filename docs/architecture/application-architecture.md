# Application Architecture

## 1. 構成

- Astro: page / layout / static content
- React Islands: interactive tool UI
- TypeScript pure modules: calculation / unit / formatter
- CSS Modules: custom layout / components
- Radix Themes: common UI primitives
- ECharts: charts
- KaTeX: formula
- draw.io source + SVG: circuit diagram

サイト全体を SPA にしない。

## 2. 初期 directory

```text
src/
├─ components/
│  ├─ layout/
│  ├─ ui/
│  └─ tools/
├─ layouts/
├─ pages/
├─ lib/
│  ├─ calculations/
│  ├─ units/
│  └─ formatters/
├─ styles/
└─ assets/
   └─ circuits/

tests/
├─ unit/
├─ e2e/
└─ fixtures/
```

Path alias:

```text
@/ -> src/
```

## 3. Naming

- React: `PascalCase.tsx`
- Astro: `PascalCase.astro`
- calculation / utility: `kebab-case.ts`
- CSS Module: `ComponentName.module.css`

## 4. Calculation

UI から分離した pure TypeScript。
入力は SI 基本単位の `number`。

主計算関数:

```ts
calculateVoltageDivider({ ... })
```

想定内 error:

```ts
type CalculationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: CalculationError[] };
```

`CalculationError`:

```ts
type CalculationError = {
  code: CalculationErrorCode;
  field?: string;
  message: string;
};
```

共通 error code 例:

- `required`
- `invalid_number`
- `out_of_range`
- `division_by_zero`

## 5. Calculation file

初期は 1 tool 1 file。

```text
src/lib/calculations/voltage-divider.ts
```

複雑化したら:

```text
src/lib/calculations/voltage-divider/
├─ calculate.ts
├─ tolerance.ts
├─ candidates.ts
└─ types.ts
```

## 6. Error Boundary

React tool area に Error Boundary を設ける。
予期しない component error が発生しても page 全体を破壊せず、tool 単位で error 表示・復帰導線を出せるようにする。

## 7. Heavy calculation

初期版では Web Worker を実装しない。
将来 heavy calculation が必要になった際に Worker 化しやすいよう、計算ロジックを UI から分離する。

## 8. Circuit diagram

- source of truth: `.drawio`
- published asset: `.svg`
- 両方 Git 管理
- SVGO は公開 SVG のみに適用
- `.drawio` は編集 source として保持

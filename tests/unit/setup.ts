import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
// jsdom はレイアウトを持たないため、Radix のサイズ監視 API のみ補う。
vi.stubGlobal(
  'ResizeObserver',
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
);
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
});

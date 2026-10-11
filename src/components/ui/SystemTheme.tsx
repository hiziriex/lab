import { Theme } from '@radix-ui/themes';
import { useEffect, useState, type ReactNode } from 'react';
export function SystemTheme({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setAppearance(media.matches ? 'dark' : 'light');
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return (
    <Theme
      appearance={appearance}
      accentColor="blue"
      grayColor="slate"
      radius="small"
      panelBackground="solid"
    >
      {children}
    </Theme>
  );
}

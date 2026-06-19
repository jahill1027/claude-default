import { useEffect, type ReactNode } from 'react';
import { applyTheme, useThemeStore } from './themeStore';

/**
 * Applies the active theme to <html> and keeps it in sync with the OS setting
 * while in `system` mode. Render once near the app root.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [mode]);

  return <>{children}</>;
}

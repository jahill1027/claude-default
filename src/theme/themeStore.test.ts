import { describe, expect, it, beforeEach } from 'vitest';
import { resolveTheme, applyTheme } from './themeStore';

describe('theme resolution', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
  });

  it('resolves explicit modes directly', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('applies the resolved theme to <html data-theme>', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});

import { useThemeStore, type ThemeMode } from './themeStore';

const LABELS: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const ICONS: Record<ThemeMode, string> = {
  light: '☀',
  dark: '☾',
  system: '◑',
};

export function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const cycle = useThemeStore((s) => s.cycle);

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[mode]}. Click to change.`}
      title={`Theme: ${LABELS[mode]}`}
      className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-fg transition-colors hover:bg-surface2"
    >
      <span aria-hidden className="text-base leading-none">
        {ICONS[mode]}
      </span>
      <span>{LABELS[mode]}</span>
    </button>
  );
}

import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { BUILD_PROFILE } from '@/config';

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-primary">
              Tales of the Valiant
            </span>
            <span className="text-sm text-muted">Character Builder</span>
          </NavLink>

          {BUILD_PROFILE === 'personal' && (
            <span
              title="This build bundles proprietary content. Personal use only — do not distribute."
              className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
            >
              Personal build
            </span>
          )}

          <nav className="ml-auto flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface2 text-fg'
                    : 'text-muted hover:text-fg'
                }`
              }
            >
              Library
            </NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        Built on the Black Flag Reference Document (CC-BY 4.0). Personal,
        non-distributed project. See ATTRIBUTION.md.
      </footer>
    </div>
  );
}

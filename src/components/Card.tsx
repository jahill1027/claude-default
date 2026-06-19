import type { ReactNode } from 'react';

/** A simple surface panel used across pages. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-line bg-surface p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

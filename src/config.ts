/**
 * Build-wide configuration.
 *
 * BUILD_PROFILE controls whether proprietary (Player's-Guide-only) content is
 * included. The default `personal` build bundles everything for private play.
 * A `shareable` build must exclude every record tagged `source: 'proprietary'`
 * so it can be distributed under the open BFRD license alone.
 *
 * Override via the Vite env var VITE_BUILD_PROFILE at build time, e.g.
 *   VITE_BUILD_PROFILE=shareable npm run build
 */
export type BuildProfile = 'personal' | 'shareable';

const raw = import.meta.env.VITE_BUILD_PROFILE;

export const BUILD_PROFILE: BuildProfile =
  raw === 'shareable' ? 'shareable' : 'personal';

/** The ruleset version stamped onto every saved character (see schema/meta). */
export const RULESET_VERSION = 'bfrd-2025-07-01';

/** Whether proprietary content should be loaded for the current build. */
export const INCLUDE_PROPRIETARY = BUILD_PROFILE === 'personal';

# engine

Pure, unit-tested rules functions (Section 6 of the spec). Takes a `Character`
plus content data and returns derived values — no UI, no storage.

Lands in M3+: ability modifiers, proficiency bonus, AC, saves, skills, HP,
leveling, spell slots. Every function here must be covered by tests against
BFRD numbers.

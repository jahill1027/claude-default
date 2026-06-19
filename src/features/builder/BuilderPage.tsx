import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDraftStore } from '@/state/draftStore';
import { WIZARD_STEPS } from './steps';

/**
 * The guided creation wizard (Section 4). A progress rail of the 8 ToV steps
 * with the active step's content beside it. The draft lives in the draft store;
 * persistence and the final "save to library" land in M4.
 */
export function BuilderPage() {
  const { id } = useParams();
  const draft = useDraftStore((s) => s.draft);
  const classSkills = useDraftStore((s) => s.classSkills);
  const step = useDraftStore((s) => s.step);
  const setStep = useDraftStore((s) => s.setStep);
  const init = useDraftStore((s) => s.init);

  // Start (or restart) a draft for this route id.
  useEffect(() => {
    if (id && draft.id !== id) init(id);
  }, [id, draft.id, init]);

  const current = WIZARD_STEPS[step];
  const StepBody = current.Component;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">Create a character</h1>
        <Link to="/" className="text-sm font-medium text-primary hover:underline">
          ← Library
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-[210px_1fr]">
        <ol className="space-y-1">
          {WIZARD_STEPS.map((s, i) => {
            const done = s.complete(draft, classSkills);
            const active = i === step;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-surface2 font-medium text-fg'
                      : 'text-muted hover:bg-surface2/60'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                      done
                        ? 'border-primary bg-primary text-primaryFg'
                        : active
                          ? 'border-primary text-primary'
                          : 'border-line'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  {s.title}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-fg">
              {step + 1}. {current.title}
            </h2>
          </div>

          <StepBody />

          <div className="flex items-center justify-between border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface2 disabled:opacity-40"
            >
              ← Back
            </button>
            <span className="text-xs text-muted">
              Step {step + 1} of {WIZARD_STEPS.length}
            </span>
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={step === WIZARD_STEPS.length - 1}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primaryFg transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

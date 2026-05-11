import { useEffect, useMemo, useState } from 'react';
import {
  QuestionTool,
  type QuestionAnswer,
  type QuestionConfig,
} from '@/components/ui/question-tool';

type SkyViewBookingModalProps = {
  open: boolean;
  onClose: () => void;
};

const bookingQuestions: QuestionConfig[] = [
  {
    kind: 'multi',
    title: 'What are you looking to integrate?',
    description: 'Choose everything that applies.',
    minSelections: 1,
    options: [
      { id: 'smart-home', label: 'Smart home automation' },
      { id: 'security-cameras', label: 'Security cameras' },
      { id: 'smart-locks', label: 'Smart locks / access control' },
      { id: 'networking', label: 'Networking / WiFi' },
      { id: 'audio-media', label: 'Audio / media' },
      { id: 'lighting-shades', label: 'Lighting / shades' },
      { id: 'str-tech', label: 'Short-term rental technology' },
      { id: 'full-system', label: 'Full property system' },
    ],
    allowCustom: true,
    customPlaceholder: 'Other system or project type',
  },
  {
    kind: 'single',
    title: 'What type of property is this?',
    options: [
      { id: 'primary-residence', label: 'Primary residence' },
      { id: 'rental-property', label: 'Rental property' },
      { id: 'short-term-rental', label: 'Short-term rental' },
      { id: 'multifamily', label: 'Multifamily property' },
      { id: 'commercial', label: 'Commercial space' },
      { id: 'not-sure', label: 'Not sure yet' },
    ],
  },
  {
    kind: 'single',
    title: 'What stage are you in?',
    options: [
      { id: 'planning', label: 'Planning' },
      { id: 'ready-walkthrough', label: 'Ready for walkthrough' },
      { id: 'renovating', label: 'Actively renovating' },
      { id: 'troubleshooting', label: 'Need troubleshooting' },
      { id: 'upgrade-ideas', label: 'Looking for upgrade ideas' },
    ],
  },
  {
    kind: 'text',
    title: 'Tell us a little about the project.',
    placeholder:
      'Example: We’re renovating a home and want locks, cameras, WiFi, and audio designed properly from the start.',
  },
];

function formatAnswerLabel(question: QuestionConfig, answer?: QuestionAnswer) {
  if (!answer || answer.kind === 'skip') return 'Skipped';

  if (answer.kind === 'text') return answer.text || '';

  const selectedLabels =
    answer.selectedIds
      ?.map((id) => question.options?.find((option) => option.id === id)?.label)
      .filter(Boolean)
      .join(', ') ?? '';

  if (answer.text) {
    return selectedLabels ? `${selectedLabels}, ${answer.text}` : answer.text;
  }

  return selectedLabels;
}

export function SkyViewBookingModal({ open, onClose }: SkyViewBookingModalProps) {
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = Object.keys(answers).length;
  const isComplete = answeredCount >= bookingQuestions.length;

  const summary = useMemo(() => {
    return bookingQuestions.map((question, index) => ({
      question: question.title,
      answer: formatAnswerLabel(question, answers[index + 1]),
    }));
  }, [answers]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmitRequest = async () => {
    const accessKey = import.meta.env.VITE_WEB3FORMS_KEY;

    if (!accessKey) {
      console.warn(
        'SkyView booking: VITE_WEB3FORMS_KEY is not set. Add it to .env and restart `npm run dev`.',
      );
      setError(
        'The booking form is not connected yet. Please call (203) 555-0184 or email us directly.',
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    // Build a readable plain-text body for the email — easier to skim than
    // the structured per-field dump alone.
    const messageBody = summary
      .map(
        (item, index) =>
          `${String(index + 1).padStart(2, '0')}. ${item.question}\n   → ${item.answer}`,
      )
      .join('\n\n');

    // Web3Forms accepts arbitrary keys and will surface them in the email
    // and dashboard. We send both the readable body AND structured fields.
    const structuredFields: Record<string, string> = {};
    summary.forEach((item, index) => {
      structuredFields[`q${index + 1}_${item.question.replace(/\s+/g, '_').slice(0, 48)}`] =
        item.answer;
    });

    const payload = {
      access_key: accessKey,
      subject: 'New SkyView walkthrough request',
      from_name: 'SkyView Website',
      submitted_at: new Date().toISOString(),
      message: messageBody,
      ...structuredFields,
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? 'Submission failed');
      }
      setSubmitted(true);
    } catch (caught) {
      console.error('SkyView booking submission failed', caught);
      setError(
        caught instanceof Error
          ? caught.message
          : 'Something went wrong sending your request. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Book a SkyView walkthrough"
      onMouseDown={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden border border-white/15 bg-[#07080b] text-white shadow-2xl sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,181,230,0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative border-b border-white/10 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-300">
                SkyView Intake
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Book a walkthrough
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/62">
                Tell us what you want connected. We’ll use this to understand the property, the systems, and the best next step.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-sky-300/50 hover:bg-white/5 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        <div className="relative max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {!submitted ? (
            <>
              {!isComplete ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <QuestionTool
                    questions={bookingQuestions}
                    submitLabel="Save"
                    nextLabel="Next"
                    skipLabel="Skip"
                    allowSkip={false}
                    onSubmitAnswer={(answer) => {
                      setAnswers((prev) => {
                        const nextIndex = Object.keys(prev).length + 1;
                        return {
                          ...prev,
                          [nextIndex]: answer,
                        };
                      });
                    }}
                    className="skyview-question-tool"
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-xl border border-sky-300/20 bg-sky-300/5 p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.26em] text-sky-300">
                      Request Summary
                    </p>

                    <div className="mt-4 space-y-3">
                      {summary.map((item, index) => (
                        <div
                          key={item.question}
                          className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
                        >
                          <p className="font-mono text-xs text-white/40">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <p className="mt-1 text-sm text-white/60">
                            {item.question}
                          </p>
                          <p className="mt-1 text-base text-white">
                            {item.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
                    >
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setAnswers({});
                        setSubmitted(false);
                        setError(null);
                      }}
                      className="h-12 border border-white/10 px-5 font-mono text-xs uppercase tracking-[0.24em] text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Start Over
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitRequest}
                      className="h-12 bg-white px-6 font-mono text-xs uppercase tracking-[0.24em] text-black transition hover:bg-sky-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? 'Sending…' : 'Request Walkthrough →'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-sky-300/20 bg-sky-300/5 px-6 py-9 text-center sm:px-8 sm:py-12">
              {/* Soft radial bloom behind the success badge */}
              <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-40 w-40 -translate-y-12 rounded-full bg-sky-300/10 blur-3xl" />

              <div className="relative flex flex-col items-center">
                {/* Animated checkmark badge — sonar pulse + stroke draw */}
                <div className="skyview-success-badge relative flex h-16 w-16 items-center justify-center rounded-full border border-sky-300/40 bg-sky-300/10">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      className="skyview-success-check"
                      d="M5 12.5 L10 17.5 L19 7"
                      stroke="rgb(103,181,230)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.32em] text-sky-300">
                  Request received
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Your walkthrough is in.
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/65">
                  A SkyView design lead is reviewing your project now. We typically reply within{' '}
                  <span className="text-white">2 business hours</span>, Monday through Friday.
                </p>

                {/* Confirmation rail — what they should expect, plus an urgent fallback */}
                <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5 border-y border-white/10 py-5 text-left">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-sky-300" />
                    <p className="text-sm leading-6 text-white/75">
                      A confirmation copy is on its way to your inbox.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-sky-300" />
                    <p className="text-sm leading-6 text-white/75">
                      We'll reach out with next steps and a same-day walkthrough plan.
                    </p>
                  </div>
                </div>

                <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.24em] text-white/45">
                  Need us sooner?{' '}
                  <a
                    href="tel:+12035550184"
                    className="text-white/85 underline-offset-4 transition hover:text-white hover:underline"
                  >
                    (203) 555-0184
                  </a>
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-7 h-12 bg-white px-7 font-mono text-xs uppercase tracking-[0.24em] text-black transition hover:bg-sky-100 active:scale-[0.99]"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

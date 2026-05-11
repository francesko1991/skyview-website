import { useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────

export type QuestionOption = {
  id: string;
  label: string;
};

export type QuestionConfig = {
  kind: 'single' | 'multi' | 'text';
  title: string;
  description?: string;
  options?: QuestionOption[];
  allowCustom?: boolean;
  customPlaceholder?: string;
  placeholder?: string;
  minSelections?: number;
};

export type QuestionAnswer =
  | { kind: 'skip' }
  | { kind: 'text'; text: string }
  | { kind: 'single'; selectedIds: string[]; text?: string }
  | { kind: 'multi'; selectedIds: string[]; text?: string };

// ─── QuestionPrompt — renders a single question's body ───────────────────

interface QuestionPromptProps {
  question: QuestionConfig;
  index: number;
  total: number;
  selectedIds: string[];
  customText: string;
  textValue: string;
  onSelectionChange: (ids: string[]) => void;
  onCustomTextChange: (text: string) => void;
  onTextChange: (text: string) => void;
}

export function QuestionPrompt({
  question,
  index,
  total,
  selectedIds,
  customText,
  textValue,
  onSelectionChange,
  onCustomTextChange,
  onTextChange,
}: QuestionPromptProps) {
  const toggle = (id: string) => {
    if (question.kind === 'single') {
      onSelectionChange(selectedIds.includes(id) ? [] : [id]);
    } else {
      onSelectionChange(
        selectedIds.includes(id)
          ? selectedIds.filter((existing) => existing !== id)
          : [...selectedIds, id],
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.28em] text-white/40">
          Question {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <h3 className="text-lg font-semibold leading-snug text-white sm:text-xl">
          {question.title}
        </h3>
        {question.description && (
          <p className="text-sm leading-6 text-white/55">{question.description}</p>
        )}
      </div>

      {question.kind === 'text' ? (
        <textarea
          value={textValue}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={question.placeholder}
          rows={4}
          className="w-full resize-none rounded-md border border-white/15 bg-black/20 px-3.5 py-3 text-sm leading-6 text-white placeholder:text-white/30 focus:outline-none"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {question.options?.map((option) => {
            const selected = selectedIds.includes(option.id);
            const isMulti = question.kind === 'multi';
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                aria-pressed={selected}
                className={cn(
                  'group flex items-center gap-3 rounded-md border px-3.5 py-3 text-left text-sm',
                  selected
                    ? 'border-blue-400/60 bg-blue-500 text-white shadow-[0_8px_22px_-12px_rgba(103,181,230,0.55)]'
                    : 'border-white/12 bg-white/[0.02] text-white/85',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-4 w-4 flex-none items-center justify-center border',
                    isMulti ? 'rounded-[3px]' : 'rounded-full',
                    selected ? 'border-white/80' : 'border-white/30',
                  )}
                >
                  {selected && (
                    <span
                      className={cn(
                        'block bg-white',
                        isMulti ? 'h-2 w-2' : 'h-1.5 w-1.5 rounded-full',
                      )}
                    />
                  )}
                </span>
                <span className="leading-snug">{option.label}</span>
              </button>
            );
          })}

          {question.allowCustom && (
            <input
              type="text"
              value={customText}
              onChange={(event) => onCustomTextChange(event.target.value)}
              placeholder={question.customPlaceholder ?? 'Other'}
              className="mt-1 w-full rounded-md border border-white/15 bg-black/20 px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
          )}
        </div>
      )}

      {/* total is rendered visually via the progress bar in QuestionTool;
          referencing it here keeps the prop part of the public API */}
      <span className="sr-only">
        Step {index + 1} of {total}
      </span>
    </div>
  );
}

// ─── QuestionTool — orchestrates a forward-paged question flow ──────────

interface QuestionToolProps {
  questions: QuestionConfig[];
  submitLabel?: string;
  nextLabel?: string;
  skipLabel?: string;
  allowSkip?: boolean;
  onSubmitAnswer: (answer: QuestionAnswer) => void;
  className?: string;
}

export function QuestionTool({
  questions,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  skipLabel = 'Skip',
  allowSkip = true,
  onSubmitAnswer,
  className,
}: QuestionToolProps) {
  const [index, setIndex] = useState(0);
  const [selectedByQ, setSelectedByQ] = useState<Record<number, string[]>>({});
  const [customByQ, setCustomByQ] = useState<Record<number, string>>({});
  const [textByQ, setTextByQ] = useState<Record<number, string>>({});

  const total = questions.length;
  const question = questions[index];
  if (!question) return null;

  const selectedIds = selectedByQ[index] ?? [];
  const customText = customByQ[index] ?? '';
  const textValue = textByQ[index] ?? '';

  const trimmedCustom = customText.trim();
  const trimmedText = textValue.trim();

  let canAdvance = false;
  if (question.kind === 'text') {
    canAdvance = trimmedText.length > 0;
  } else if (question.kind === 'single') {
    canAdvance =
      selectedIds.length === 1 ||
      (question.allowCustom === true && trimmedCustom.length > 0);
  } else {
    const min = question.minSelections ?? 1;
    canAdvance =
      selectedIds.length >= min ||
      (question.allowCustom === true && trimmedCustom.length > 0);
  }

  const isLast = index === total - 1;

  const submit = (skip: boolean) => {
    let answer: QuestionAnswer;
    if (skip) {
      answer = { kind: 'skip' };
    } else if (question.kind === 'text') {
      answer = { kind: 'text', text: trimmedText };
    } else if (question.kind === 'single') {
      answer = trimmedCustom
        ? { kind: 'single', selectedIds, text: trimmedCustom }
        : { kind: 'single', selectedIds };
    } else {
      answer = trimmedCustom
        ? { kind: 'multi', selectedIds, text: trimmedCustom }
        : { kind: 'multi', selectedIds };
    }

    onSubmitAnswer(answer);
    if (!isLast) setIndex(index + 1);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-col gap-5 p-5 sm:p-6">
        {/* Progress segments — the section's visual rhythm cue */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {questions.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-[3px] flex-1 rounded-full transition-colors duration-300',
                i < index
                  ? 'bg-blue-500'
                  : i === index
                    ? 'bg-white/55'
                    : 'bg-white/10',
              )}
            />
          ))}
        </div>

        <QuestionPrompt
          question={question}
          index={index}
          total={total}
          selectedIds={selectedIds}
          customText={customText}
          textValue={textValue}
          onSelectionChange={(ids) =>
            setSelectedByQ((state) => ({ ...state, [index]: ids }))
          }
          onCustomTextChange={(text) =>
            setCustomByQ((state) => ({ ...state, [index]: text }))
          }
          onTextChange={(text) =>
            setTextByQ((state) => ({ ...state, [index]: text }))
          }
        />

        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-white/35">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </p>

          <div className="flex items-center gap-3">
            {allowSkip && (
              <button
                type="button"
                onClick={() => submit(true)}
                className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/55 transition hover:text-white"
              >
                {skipLabel}
              </button>
            )}
            <button
              type="button"
              disabled={!canAdvance}
              onClick={() => submit(false)}
              className="bg-blue-500 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-400"
            >
              {isLast ? submitLabel : nextLabel} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

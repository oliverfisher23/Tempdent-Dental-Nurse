import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import type { CheckKind } from './check';
import { cn } from '@kit/lib/utils';

interface CheckFeedbackProps {
  /** Green when the work stands, amber for a note worth hearing, red when something needs another look. */
  kind: CheckKind;
  /** The first line: what the check found, in a few words. */
  title?: string;
  /** Who is speaking, when the feedback is a colleague's line. */
  speaker?: string;
  children?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
  testId?: string;
}

const ICONS = { ok: CheckCircle2, note: MessageSquare, issue: AlertCircle } as const;

const TONES: Record<'light' | 'dark', Record<CheckKind, string>> = {
  dark: {
    ok: 'border-emerald-500/30 bg-emerald-950/30 text-emerald-100',
    note: 'border-amber-500/30 bg-amber-950/30 text-amber-100',
    issue: 'border-red-500/30 bg-red-950/30 text-red-100',
  },
  light: {
    ok: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    note: 'border-amber-300 bg-amber-50 text-amber-900',
    issue: 'border-red-300 bg-red-50 text-red-900',
  },
};

const ICON_TONES: Record<'light' | 'dark', Record<CheckKind, string>> = {
  dark: { ok: 'text-emerald-300', note: 'text-amber-300', issue: 'text-red-300' },
  light: { ok: 'text-emerald-700', note: 'text-amber-700', issue: 'text-red-700' },
};

/**
 * The block every check answers with, so a result looks the same at the delivery door,
 * on the allergen chart and at the guest decisions: an icon and colour for the outcome,
 * a short title, then the detail. Announced politely, since it appears in answer to a press.
 */
export function CheckFeedback({ kind, title, speaker, children, tone = 'dark', className, testId }: CheckFeedbackProps) {
  const Icon = ICONS[kind];
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={testId}
      data-kind={kind}
      className={cn('flex gap-3 rounded-lg border p-3 text-sm', TONES[tone][kind], className)}
    >
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_TONES[tone][kind])} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {speaker && <p className="text-xs font-bold uppercase tracking-widest opacity-80">{speaker}</p>}
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}

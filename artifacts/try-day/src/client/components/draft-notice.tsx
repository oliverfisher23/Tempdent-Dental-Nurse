import { DRAFT_NOTICE } from '@client/content/client';

/**
 * The review-prototype label that every clinical card carries. The welcome copy
 * says it once; this keeps it in view on resumed tasks and the close page, where
 * a learner would otherwise read unapproved clinical detail without the caveat.
 */
export function DraftNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`mt-2 text-xs font-semibold text-muted-foreground ${className}`.trim()} data-testid="draft-notice">
      {DRAFT_NOTICE}
    </p>
  );
}

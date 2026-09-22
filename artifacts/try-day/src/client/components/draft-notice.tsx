import { PLACEHOLDER_IMAGERY_NOTICE } from '@client/content/client';

/** Kept as DraftNotice so existing task and close-page callers remain stable. */
export function DraftNotice({ className = '' }: { className?: string }) {
  return (
    <p className={`mt-2 text-xs font-semibold text-muted-foreground ${className}`.trim()} data-testid="draft-notice">
      {PLACEHOLDER_IMAGERY_NOTICE}
    </p>
  );
}

import type { CloseState } from './simulation';
import type { CloseRedesignState } from './redesign-types';
import { HANDOVER_FIELDS, type HandoverField } from '@client/content/activities';
import { EVENING_EXCHANGE, type ExchangeTopicId } from '@client/content/scenes/close-exchange';

/** Follow-ups the learner groups and names an owner for (approved decision P3). */
export const FOLLOW_UP_IDS = ['larder2', 'salmon', 'table3'] as const;
export type FollowUpId = (typeof FOLLOW_UP_IDS)[number];

/** Follow-ups that every approved priority order places before service. */
export const BEFORE_SERVICE_IDS: FollowUpId[] = ['larder2', 'table3'];

export function answerKey(topic: ExchangeTopicId, part: string): string {
  return `${topic}.${part}`;
}

/** The option that resolves each part of each question, taken from the question set itself. */
export function requiredAnswers(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const topic of EVENING_EXCHANGE) {
    for (const part of topic.parts) {
      const correct = part.options.find((o) => o.correct);
      if (correct) out[answerKey(topic.id, part.id)] = correct.id;
    }
  }
  return out;
}

export function topicResolved(rs: CloseRedesignState, topicId: ExchangeTopicId): boolean {
  const topic = EVENING_EXCHANGE.find((t) => t.id === topicId);
  if (!topic) return false;
  return topic.parts.every((part) => {
    const correct = part.options.find((o) => o.correct);
    return !!correct && rs.clarifications[answerKey(topicId, part.id)] === correct.id;
  });
}

export function unresolvedTopics(rs: CloseRedesignState): ExchangeTopicId[] {
  return EVENING_EXCHANGE.filter((topic) => !topicResolved(rs, topic.id)).map((topic) => topic.id);
}

/** Questions that must be asked again when a heading changes (approved decision P4). */
export function topicsForHeading(heading: HandoverField['id']): ExchangeTopicId[] {
  return EVENING_EXCHANGE.filter((topic) => topic.headings.includes(heading)).map((topic) => topic.id);
}

export function clearAnswersForHeading(
  clarifications: Record<string, string>,
  heading: HandoverField['id'],
): Record<string, string> {
  const topics = topicsForHeading(heading);
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(clarifications)) {
    const topic = key.split('.')[0] as ExchangeTopicId;
    if (!topics.includes(topic)) out[key] = value;
  }
  return out;
}

export function headingsFilled(state: CloseState): boolean {
  return HANDOVER_FIELDS.every((f) => (state.handover[f.id] ?? '').trim().length > 0);
}

/** Every follow-up has a timing and a named person or role. */
export function followUpsGrouped(rs: CloseRedesignState): boolean {
  return FOLLOW_UP_IDS.every(
    (id) =>
      (rs.priorities[id] === 'before-service' || rs.priorities[id] === 'later') &&
      !!rs.responsibilities?.[id]?.trim(),
  );
}

/** Follow-ups grouped as later that the evening team will question before taking the sheet. */
export function timingIssues(rs: CloseRedesignState): FollowUpId[] {
  return BEFORE_SERVICE_IDS.filter((id) => rs.priorities[id] === 'later');
}

/** The sheet is complete enough for the evening team to start asking questions. */
export function isHandoverReady(state: CloseState): boolean {
  const rs = state.redesign;
  if (!rs) return false;
  return headingsFilled(state) && followUpsGrouped(rs);
}

/**
 * The handover counts as delivered when the sheet is filled in, the follow-ups are grouped
 * with an owner in one of the approved orders, every evening-team question is resolved
 * with a supported answer, and the learner has confirmed the read-back (P3–P5).
 */
export function handoverDelivered(state: CloseState): boolean {
  const rs = state.redesign;
  if (!rs) return false;
  return (
    isHandoverReady(state) &&
    timingIssues(rs).length === 0 &&
    unresolvedTopics(rs).length === 0 &&
    !!rs.recipientConfirmed
  );
}

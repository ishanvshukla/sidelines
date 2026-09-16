// Mirrored by FEEDBACK_CATEGORIES in server.py — keep the ids in sync.
export const FEEDBACK_CATEGORIES = [
  { id: 'articles-not-loading', label: "Articles aren't loading" },
  { id: 'irrelevant-articles', label: "My team's articles aren't relevant" },
  { id: 'scores-wrong-team', label: 'Scores widget shows the wrong team' },
  { id: 'sign-in-issues', label: 'Trouble signing in' },
  { id: 'other', label: 'Other' },
] as const;

export type FeedbackCategoryId = (typeof FEEDBACK_CATEGORIES)[number]['id'];

export const FEEDBACK_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  FEEDBACK_CATEGORIES.map((c) => [c.id, c.label])
);

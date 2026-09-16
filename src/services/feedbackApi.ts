import type { Prefs } from '../types/news';
import type { FeedbackCategoryId } from '../constants/feedback';

export interface FeedbackItem {
  // Absent on reports filed before ids/statuses existed; the server backfills
  // an id the first time the inbox is read, so this is only briefly undefined.
  id?: string;
  status?: 'open' | 'fixed';
  category: string;
  message: string;
  email: string | null;
  sports: string[];
  teams: Record<string, string[]>;
  created_at: string;
  /** What the admin wrote when marking it fixed */
  note?: string;
  fixed_at?: string;
}

export interface FeedbackInbox {
  items: FeedbackItem[];
  counts: Record<string, number>;
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function submitFeedback(
  category: FeedbackCategoryId,
  message: string,
  prefs: Prefs | null,
  token: string | null
): Promise<void> {
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ category, message, prefs }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Failed to send feedback');
  }
}

export async function fetchFeedbackAccess(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/feedback/access', { headers: authHeaders(token) });
    if (!res.ok) return false;
    const data = (await res.json()) as { admin: boolean };
    return data.admin;
  } catch {
    return false;
  }
}

/** Marks a report fixed, optionally with a note included in the reporter's
 *  email; resolves to whether that email actually went out. */
export async function resolveFeedback(
  token: string,
  id: string,
  note: string
): Promise<boolean> {
  const res = await fetch('/api/feedback/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ id, note }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Failed to mark as fixed');
  }
  const data = (await res.json()) as { notified: boolean };
  return data.notified;
}

export async function fetchFeedbackInbox(token: string): Promise<FeedbackInbox> {
  const res = await fetch('/api/feedback', { headers: authHeaders(token) });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Failed to load feedback');
  }
  return (await res.json()) as FeedbackInbox;
}

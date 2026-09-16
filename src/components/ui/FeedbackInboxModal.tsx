import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FEEDBACK_CATEGORY_LABELS } from '../../constants/feedback';
import { fetchFeedbackInbox, type FeedbackInbox } from '../../services/feedbackApi';

interface Props {
  onClose(): void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function FeedbackInboxModal({ onClose }: Props) {
  const { token } = useAuth();
  const [inbox, setInbox] = useState<FeedbackInbox | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchFeedbackInbox(token)
      .then((data) => { if (!cancelled) setInbox(data); })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load feedback');
      });
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col bg-espn-card border border-espn-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <span className="font-oswald font-semibold uppercase tracking-widest text-sm text-white">
            Feedback <span className="text-gold">inbox</span>
          </span>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors w-7 h-7 flex items-center justify-center text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mx-6 mb-6 text-red-400 text-xs font-inter text-center bg-red-400/10 rounded-lg py-2 px-3">
            {error}
          </p>
        )}

        {!inbox && !error && (
          <p className="px-6 pb-8 text-gray-500 text-sm font-inter text-center animate-pulse">Loading…</p>
        )}

        {inbox && inbox.items.length === 0 && (
          <p className="px-6 pb-8 text-gray-500 text-sm font-inter text-center">No reports yet.</p>
        )}

        {inbox && inbox.items.length > 0 && (
          <>
            {/* Per-category counts — the triage view */}
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {Object.entries(inbox.counts)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, count]) => (
                  <span
                    key={cat}
                    className="px-2.5 py-1 rounded-full border border-espn-border text-xs font-inter text-gray-400"
                  >
                    {FEEDBACK_CATEGORY_LABELS[cat] ?? cat}
                    <span className="ml-1.5 text-gold font-semibold">{count}</span>
                  </span>
                ))}
            </div>

            <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-3">
              {inbox.items.map((item, i) => (
                <div key={i} className="border border-espn-border rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-oswald uppercase tracking-wider text-xs text-gold">
                      {FEEDBACK_CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    <span className="text-gray-600 text-xs font-inter shrink-0">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs font-inter mb-1">
                    {item.email ?? 'anonymous'}
                  </p>
                  {item.message && (
                    <p className="text-gray-300 text-sm font-inter whitespace-pre-wrap break-words">
                      {item.message}
                    </p>
                  )}
                  {Object.keys(item.teams).length > 0 && (
                    <p className="mt-1.5 text-gray-500 text-xs font-inter">
                      Follows:{' '}
                      {Object.entries(item.teams)
                        .map(([sport, teams]) => `${sport}: ${teams.join(', ')}`)
                        .join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

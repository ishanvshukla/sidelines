import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FEEDBACK_CATEGORIES, type FeedbackCategoryId } from '../../constants/feedback';
import { submitFeedback } from '../../services/feedbackApi';
import type { Prefs } from '../../types/news';

interface Props {
  prefs: Prefs | null;
  onClose(): void;
}

export default function FeedbackModal({ prefs, onClose }: Props) {
  const { token } = useAuth();
  const [category, setCategory] = useState<FeedbackCategoryId | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const needsMessage = category === 'other';
  const canSubmit = !!category && (!needsMessage || message.trim().length > 0) && !sending;

  async function handleSubmit() {
    if (!category) return;
    setError('');
    setSending(true);
    try {
      await submitFeedback(category, message.trim(), prefs, token);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm mx-4 bg-espn-card border border-espn-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <span className="font-oswald font-semibold uppercase tracking-widest text-sm text-white">
            Report an <span className="text-gold">issue</span>
          </span>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors w-7 h-7 flex items-center justify-center text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center">
            <p className="font-oswald uppercase tracking-wider text-gold mb-2">Thanks!</p>
            <p className="text-gray-400 text-sm font-inter mb-6">
              Your report is in — we'll look into it.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded bg-gold text-black font-oswald text-xs uppercase tracking-widest hover:bg-gold-bright transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="px-6 pt-4 pb-6">
            <p className="text-gray-500 text-xs font-inter mb-4">
              What went wrong? Pick the closest match.
            </p>

            <div className="flex flex-col gap-2 mb-4">
              {FEEDBACK_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`text-left px-4 py-2.5 rounded-lg border text-sm font-inter transition-colors ${
                    category === c.id
                      ? 'border-gold text-white bg-gold/10'
                      : 'border-espn-border text-gray-400 hover:text-white hover:border-gold-dim'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {category && (
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={needsMessage ? 'Tell us what went wrong…' : 'Any details? (optional)'}
                className="w-full mb-4 px-3 py-2 rounded-lg bg-espn-dark border border-espn-border text-sm font-inter text-white placeholder-gray-600 focus:outline-none focus:border-gold-dim resize-none"
              />
            )}

            {error && (
              <p className="mb-4 text-red-400 text-xs font-inter text-center bg-red-400/10 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-2.5 rounded bg-gold text-black font-oswald text-xs uppercase tracking-widest hover:bg-gold-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending…' : 'Send report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

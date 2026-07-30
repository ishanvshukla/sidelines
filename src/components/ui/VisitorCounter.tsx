import { useEffect, useState } from 'react';
import axios from 'axios';

const STORAGE_KEY = 'visitor_number';

export default function VisitorCounter() {
  const [number, setNumber] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? Number(stored) : null;
  });
  const [totalVisits, setTotalVisits] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const claim = number === null;
    axios
      .post<{ number: number; totalVisits: number }>('/api/visitor', { claim })
      .then(({ data }) => {
        if (cancelled) return;
        if (claim) {
          localStorage.setItem(STORAGE_KEY, String(data.number));
          setNumber(data.number);
        }
        setTotalVisits(data.totalVisits);
      })
      .catch(() => {
        // Non-critical widget — silently skip if the server is unreachable
      });
    return () => {
      cancelled = true;
    };
    // Runs once per mount — `number` is read at mount time only, not re-claimed on change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (number === null) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-espn-card border border-espn-border rounded px-3 py-2 shadow-lg pointer-events-none select-none">
      <p className="font-inter text-xs text-stone leading-tight">
        You're visitor{' '}
        <span className="font-heading text-gold-bright">#{number.toLocaleString()}</span>
      </p>
      {totalVisits !== null && (
        <p className="font-inter text-xs text-stone leading-tight">
          <span className="font-heading text-gold-bright">{totalVisits.toLocaleString()}</span>{' '}
          visits so far
        </p>
      )}
    </div>
  );
}

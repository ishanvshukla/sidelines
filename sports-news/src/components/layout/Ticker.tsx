import { useTopStories } from '../../hooks/useNews';

export default function Ticker() {
  const { data: articles } = useTopStories();

  const headlines = articles?.map((a) => `${a.title}  —  ${a.source.name}`) ?? [
    'Loading latest sports headlines...',
  ];

  const text = headlines.join('     •     ');

  return (
    <div className="ticker-wrap bg-accent-red overflow-hidden">
      <div className="py-1.5 px-4 flex items-center gap-4">
        <span className="font-oswald font-700 text-white text-xs uppercase tracking-widest whitespace-nowrap bg-black px-2 py-0.5 shrink-0">
          Breaking
        </span>
        <div className="overflow-hidden flex-1">
          <span
            className="ticker-content inline-block whitespace-nowrap animate-ticker text-white text-xs font-inter font-medium"
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}

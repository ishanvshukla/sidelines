import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useTopStories } from '../../hooks/useNews';
import type { Article } from '../../types/news';

const FALLBACK_GRADIENT = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';

function HeroSlide({ article, index }: { article: Article; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0"
    >
      {/* Background */}
      {article.urlToImage && !imgError ? (
        <img
          src={article.urlToImage}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full" style={{ background: FALLBACK_GRADIENT }} />
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-3xl">
        <div className="mb-3 flex items-center gap-3">
          <span className="font-oswald text-xs font-semibold uppercase tracking-widest text-accent-red">
            {article.source.name}
          </span>
          <span className="text-gray-400 text-xs">
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </span>
        </div>
        <h2 className="font-oswald font-bold text-2xl md:text-4xl lg:text-5xl text-white leading-tight line-clamp-3 mb-4">
          {article.title}
        </h2>
        {article.description && (
          <p className="text-gray-300 text-sm md:text-base line-clamp-2 mb-5 max-w-xl">
            {article.description}
          </p>
        )}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-accent-red hover:bg-accent-red-hover text-white font-oswald font-semibold uppercase tracking-wider px-5 py-2.5 text-sm transition-colors"
        >
          Read Full Story →
        </a>
      </div>
    </motion.div>
  );
}

export default function HeroCarousel() {
  const { data: articles, isLoading } = useTopStories();
  const [current, setCurrent] = useState(0);

  const validArticles = articles?.filter((a) => a.urlToImage) ?? articles ?? [];

  useEffect(() => {
    if (!validArticles.length) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % validArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [validArticles.length]);

  if (isLoading) {
    return (
      <div className="relative w-full h-[60vh] bg-espn-card animate-pulse flex items-center justify-center">
        <div className="text-gray-500 font-oswald text-xl uppercase tracking-widest">
          Loading top stories...
        </div>
      </div>
    );
  }

  if (!validArticles.length) {
    return (
      <div className="relative w-full h-[40vh] bg-espn-card flex items-center justify-center">
        <p className="text-gray-400 font-oswald">No stories available. Check your API key.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] overflow-hidden bg-espn-dark">
      <AnimatePresence mode="wait">
        <HeroSlide
          key={current}
          article={validArticles[current]}
          index={current}
        />
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute bottom-5 right-6 md:right-12 flex gap-2 z-10">
        {validArticles.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === current ? 'bg-accent-red w-6' : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <motion.div
          key={current}
          className="h-full bg-accent-red"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 6, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

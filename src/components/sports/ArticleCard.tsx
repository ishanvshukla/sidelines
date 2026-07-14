import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import type { Article, Sport } from '../../types/news';
import SportIcon from '../ui/SportIcon';

interface Props {
  article: Article;
  sport: Sport;
  tagLabel?: string | null;
  /** "hero" renders the broadcast-style lead card with a lower-third chyron. */
  variant?: 'hero' | 'compact';
}

/** Relative time for fresh stories, short absolute date otherwise
 *  (also covers publish dates that disagree with the local clock). */
function formatWhen(publishedAt: string): string {
  const date = new Date(publishedAt);
  const age = Date.now() - date.getTime();
  if (age > 0 && age < 7 * 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'd MMM');
}

function ArticleImage({ article, sport, onError, errored, iconSize }: {
  article: Article;
  sport: Sport;
  onError: () => void;
  errored: boolean;
  iconSize: number;
}) {
  if (article.urlToImage && !errored) {
    return (
      <img
        src={article.urlToImage}
        alt=""
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        onError={onError}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${sport.color}14 0%, #0b0a07 100%)` }}
    >
      <span style={{ color: sport.color, opacity: 0.25 }}>
        <SportIcon sportId={sport.id} size={iconSize} />
      </span>
    </div>
  );
}

export default function ArticleCard({ article, sport, tagLabel, variant = 'compact' }: Props) {
  const [imgError, setImgError] = useState(false);

  if (variant === 'hero') {
    return (
      <motion.a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block sm:col-span-2 sm:row-span-2 aspect-[16/10] sm:aspect-auto bg-espn-card rounded border border-espn-border overflow-hidden group cursor-pointer"
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
      >
        <div className="absolute inset-0">
          <ArticleImage
            article={article}
            sport={sport}
            errored={imgError}
            onError={() => setImgError(true)}
            iconSize={96}
          />
        </div>
        {/* Scrim so the chyron sits on quiet ground */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(11,10,7,0.55) 0%, rgba(11,10,7,0) 45%)' }}
        />
        {/* Lower-third chyron */}
        <div
          className="absolute left-0 bottom-5 max-w-[88%] px-4 py-3 bg-espn-dark/95"
          style={{ borderLeft: `3px solid ${sport.color}` }}
        >
          <div className="flex items-baseline gap-2.5 mb-1.5 font-oswald font-semibold text-xs uppercase">
            <span className="tracking-[0.18em]" style={{ color: sport.color }}>
              {tagLabel ?? sport.label}
            </span>
            <span className="tracking-[0.08em] text-stone">
              {article.source.name} · {formatWhen(article.publishedAt)}
            </span>
          </div>
          <h3 className="font-editorial font-semibold text-chalk text-lg sm:text-xl leading-snug line-clamp-3">
            {article.title}
          </h3>
        </div>
      </motion.a>
    );
  }

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col bg-espn-card rounded overflow-hidden border border-espn-border hover:border-gold-dim transition-colors group cursor-pointer"
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative w-full aspect-[16/10] overflow-hidden">
        <ArticleImage
          article={article}
          sport={sport}
          errored={imgError}
          onError={() => setImgError(true)}
          iconSize={52}
        />
      </div>

      <div className="flex flex-col flex-1 gap-2 p-3.5">
        {tagLabel && (
          <span
            className="self-start text-[10px] font-oswald font-semibold uppercase tracking-[0.18em]"
            style={{ color: sport.color }}
          >
            {tagLabel}
          </span>
        )}
        <h3 className="font-editorial font-semibold text-chalk text-[15px] leading-[1.35] line-clamp-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-stone/80 text-xs line-clamp-2 leading-relaxed font-inter">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between text-[11px] text-stone mt-auto pt-1">
          <span className="font-inter font-medium truncate max-w-[60%]">{article.source.name}</span>
          <span className="font-inter">{formatWhen(article.publishedAt)}</span>
        </div>
      </div>
    </motion.a>
  );
}

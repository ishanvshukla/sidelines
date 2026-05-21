import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import type { Article } from '../../types/news';
import type { Sport } from '../../types/news';
import SportBadge from '../ui/SportBadge';

interface Props {
  article: Article;
  sport: Sport;
}

export default function ArticleCard({ article, sport }: Props) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-espn-card rounded-lg overflow-hidden border border-espn-border hover:border-opacity-60 group cursor-pointer"
      style={{ '--sport-color': sport.color } as React.CSSProperties}
      whileHover={{ y: -4, boxShadow: `0 12px 32px rgba(0,0,0,0.5)` }}
      transition={{ duration: 0.2 }}
    >
      {/* Image */}
      <div className="relative w-full aspect-video overflow-hidden">
        {article.urlToImage && !imgError ? (
          <img
            src={article.urlToImage}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${sport.color}22 0%, #16213e 100%)`,
            }}
          >
            <span className="text-4xl opacity-30">
              {sport.id === 'tennis' ? '🎾' : sport.id === 'basketball' ? '🏀' : '🏏'}
            </span>
          </div>
        )}
        {/* Badge overlay */}
        <div className="absolute top-3 left-3">
          <SportBadge sport={sport} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-oswald font-semibold text-white text-base leading-snug line-clamp-2 group-hover:text-gray-100 mb-2">
          {article.title}
        </h3>
        {article.description && (
          <p className="text-gray-400 text-xs line-clamp-2 mb-3 leading-relaxed">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-medium truncate max-w-[60%]">{article.source.name}</span>
          <span>
            {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="h-0.5 w-0 group-hover:w-full transition-all duration-300"
        style={{ backgroundColor: sport.color }}
      />
    </motion.a>
  );
}

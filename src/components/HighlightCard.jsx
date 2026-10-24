import { useState } from 'react';
import { FiPlay, FiX } from 'react-icons/fi';
import './HighlightCard.css';

export default function HighlightCard({ highlight }) {
  const [showVideo, setShowVideo] = useState(false);

  if (!highlight) return null;

  const title = highlight.title || '';
  const competition = highlight.competitionName || highlight.competition?.name || highlight.competition || '';
  const thumbnail = highlight.thumbnail || '';
  const embedCode = highlight.videos?.[0]?.embed;

  return (
    <>
      <div className="highlight-card" onClick={() => setShowVideo(true)}>
        <div className="highlight-card__thumb">
          {thumbnail ? (
            <img src={thumbnail} alt={title} loading="lazy" />
          ) : (
            <div className="highlight-card__thumb-placeholder" />
          )}
          <div className="highlight-card__play">
            <FiPlay />
          </div>
          {competition && (
            <span className="highlight-card__badge">{competition}</span>
          )}
        </div>
        <div className="highlight-card__info">
          <h3 className="highlight-card__title">{title}</h3>
          {highlight.date && (
            <span className="highlight-card__date">
              {new Date(highlight.date).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>

      {showVideo && embedCode && (
        <div className="highlight-modal" onClick={() => setShowVideo(false)}>
          <div className="highlight-modal__content" onClick={e => e.stopPropagation()}>
            <button className="highlight-modal__close" onClick={() => setShowVideo(false)}>
              <FiX />
            </button>
            <div className="highlight-modal__title">{title}</div>
            <div
              className="highlight-modal__video"
              dangerouslySetInnerHTML={{ __html: embedCode }}
            />
          </div>
        </div>
      )}
    </>
  );
}

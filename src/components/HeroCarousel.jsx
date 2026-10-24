import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiHeart, FiInfo, FiStar } from 'react-icons/fi';
import './HeroCarousel.css';

export default function HeroCarousel({ movies = [] }) {
  const [current, setCurrent] = useState(0);
  const items = movies.slice(0, 10);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, items.length]);

  if (items.length === 0) return null;

  const movie = items[current];
  // poster_url from Ophim is already an absolute URL
  const bg = movie.thumb_url || movie.poster_url || '';

  // Build meta badges
  const metaBadges = [];
  if (movie.vote_average) {
    metaBadges.push({ label: `IMDb ${movie.vote_average.toFixed(1)}`, type: 'imdb' });
  }
  if (movie.year) metaBadges.push({ label: String(movie.year), type: 'outline' });
  if (movie.episode_total) metaBadges.push({ label: `Phần ${movie.episode_total}`, type: 'outline' });
  if (movie.episode_current) metaBadges.push({ label: movie.episode_current, type: 'outline' });

  return (
    <div className="hero">
      {/* Background poster */}
      <div className="hero__bg" style={{ backgroundImage: `url(${bg})` }} key={current} />
      <div className="hero__gradient" />

      {/* Content overlay */}
      <div className="hero__content container">
        <div className="hero__info" key={`info-${current}`}>
          <h1 className="hero__title">{movie.name}</h1>
          <p className="hero__origin">{movie.origin_name}</p>

          {/* Meta badges row */}
          {metaBadges.length > 0 && (
            <div className="hero__meta-badges">
              {metaBadges.map((b, i) => (
                <span key={i} className={`badge-${b.type}`}>{b.label}</span>
              ))}
            </div>
          )}

          {/* Genre tags */}
          {movie.category?.length > 0 && (
            <div className="hero__genres">
              {movie.category.map(c => (
                <Link key={c.slug} to={`/the-loai/${c.slug}`} className="hero__genre-tag">
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {/* Description */}
          {(movie.content || movie.overview) && (
            <p className="hero__desc lim-3">
              {(movie.content || movie.overview).replace(/<[^>]*>/g, '').substring(0, 200)}...
            </p>
          )}

          {/* Action buttons */}
          <div className="hero__actions">
            <Link to={`/phim/${movie.slug}`} className="hero__play-btn">
              <FiPlay />
            </Link>
            <button className="hero__action-icon" title="Yêu thích">
              <FiHeart />
            </button>
            <Link to={`/phim/${movie.slug}`} className="hero__action-icon" title="Chi tiết">
              <FiInfo />
            </Link>
          </div>
        </div>

        {/* Thumbnail selector */}
        <div className="hero__thumbs">
          {items.map((m, i) => {
            const thumbSrc = m.thumb_url || m.poster_url || '';
            return (
              <button
                key={m._id || m.slug || i}
                className={`hero__thumb ${i === current ? 'hero__thumb--active' : ''}`}
                onClick={() => setCurrent(i)}
              >
                <img src={thumbSrc} alt={m.name} loading="lazy" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import MovieCard from './MovieCard';
import './MovieCarousel.css';

export default function MovieCarousel({ title, linkTo, movies = [], className = '', eyebrow }) {
  const scrollRef = useRef(null);

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className={`movie-carousel ${className}`.trim()}>
      <div className="mc-sidebar">
        {eyebrow && <span className="mc-eyebrow">{eyebrow}</span>}
        <h2 className="mc-title">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="mc-link">
            Xem toàn bộ <FiChevronRight />
          </Link>
        )}
      </div>
      <div className="mc-track-wrap">
        <div className="mc-track" ref={scrollRef}>
          {movies.map(movie => (
            <div key={movie._id || movie.slug} className="mc-slide">
              <MovieCard movie={movie} landscape />
            </div>
          ))}
        </div>
        <button className="mc-arrow" onClick={scrollRight} aria-label="Next">
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
}

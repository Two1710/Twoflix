import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchOphimList } from '../services/ophim';
import HeroCarousel from '../components/HeroCarousel';
import MovieCarousel from '../components/MovieCarousel';
import CategoryInterest from '../components/CategoryInterest';
import MovieCard from '../components/MovieCard';
import { FiChevronRight, FiTrendingUp, FiFilm, FiTv, FiStar } from 'react-icons/fi';

const SECTIONS = [
  {
    id: 'phim-moi',
    type: 'phim-moi-cap-nhat',
    title: <><span className="highlight-green">Phim Mới</span> Cập Nhật</>,
    path: '/danh-sach/phim-moi-cap-nhat',
    isGrid: true,
  },
  {
    id: 'phim-bo',
    type: 'phim-bo',
    title: <><span className="highlight-pink">Phim Bộ</span> Đang Hot</>,
    path: '/danh-sach/phim-bo',
  },
  {
    id: 'phim-le',
    type: 'phim-le',
    title: <><span className="highlight-blue">Phim Lẻ</span> Hay Nhất</>,
    path: '/danh-sach/phim-le',
  },
  {
    id: 'hoat-hinh',
    type: 'hoat-hinh',
    title: <><span className="highlight-orange">Hoạt Hình</span> Mới Nhất</>,
    path: '/danh-sach/hoat-hinh',
  },
  {
    id: 'tv-shows',
    type: 'tv-shows',
    title: <><span className="highlight-purple">TV Shows</span> Nổi Bật</>,
    path: '/danh-sach/tv-shows',
  },
];

export default function HomePage() {
  const [heroMovies, setHeroMovies] = useState([]);
  const [sections, setSections] = useState({});
  const [hotMovies, setHotMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      try {
        const [results, hotData] = await Promise.all([
          Promise.allSettled(SECTIONS.map(s => fetchOphimList(s.type, 1))),
          fetch('/api/hot-movies', { cache: 'no-store' })
            .then(response => response.ok ? response.json() : { movies: [] })
            .catch(() => ({ movies: [] })),
        ]);

        const data = {};
        results.forEach((res, i) => {
          if (res.status === 'fulfilled') {
            data[SECTIONS[i].id] = res.value.items || [];
          } else {
            data[SECTIONS[i].id] = [];
          }
        });

        setSections(data);
        setHotMovies(hotData.movies || []);
        // Use phim-bo for hero banner as they tend to have best backdrops
        const hero = data['phim-bo'] || data['phim-moi'] || [];
        setHeroMovies(hero.slice(0, 8));
      } catch (err) {
        console.error('Error loading homepage:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </div>
    );
  }

  const gridSection = SECTIONS.find(s => s.isGrid);
  const carouselSections = SECTIONS.filter(s => !s.isGrid);

  return (
    <div>
      {/* Hero Banner */}
      <HeroCarousel movies={heroMovies} />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="fluid-gap" style={{ paddingTop: '30px', paddingBottom: '60px' }}>

          {/* Category Interest chips */}
          <CategoryInterest />

          {hotMovies.length > 0 && <MovieCarousel className="movie-carousel--hot" eyebrow="TUYỂN CHỌN BIÊN TẬP" title="Phim Hot" movies={hotMovies} />}

          {/* Phim Mới Grid */}
          {gridSection && sections[gridSection.id]?.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">{gridSection.title}</h2>
                <Link to={gridSection.path} className="section-link">
                  Xem tất cả <FiChevronRight />
                </Link>
              </div>
              <div className="movie-grid">
                {sections[gridSection.id].slice(0, 24).map(movie => (
                  <MovieCard key={movie._id || movie.slug} movie={movie} />
                ))}
              </div>
            </div>
          )}

          {/* Carousels */}
          {carouselSections.map(section => {
            const items = sections[section.id] || [];
            if (items.length === 0) return null;
            return (
              <MovieCarousel
                key={section.id}
                title={section.title}
                linkTo={section.path}
                movies={items}
              />
            );
          })}

        </div>
      </div>
    </div>
  );
}

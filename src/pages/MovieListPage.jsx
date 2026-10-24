import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { fetchOphimList, fetchOphimByCategory } from '../services/ophim';
import MovieCard from '../components/MovieCard';
import Pagination from '../components/Pagination';
import FilterBar from '../components/FilterBar';

const TYPE_TITLES = {
  'phim-moi-cap-nhat': 'Phim Mới Cập Nhật',
  'phim-bo': 'Phim Bộ',
  'phim-le': 'Phim Lẻ',
  'hoat-hinh': 'Hoạt Hình',
  'tv-shows': 'TV Shows',
};

export default function MovieListPage() {
  const { type, slug } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [movies, setMovies] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    country: searchParams.get('country') || '',
    year: searchParams.get('year') || '',
    type: searchParams.get('type') || '',
    sort: searchParams.get('sort') || '_id',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    async function load() {
      try {
        let res;
        if (slug) {
          const filterType = location.pathname.startsWith('/the-loai') ? 'the-loai' : 'quoc-gia';
          res = await fetchOphimByCategory(filterType, slug, currentPage, filters);
          setTitle(res.title || slug);
        } else {
          res = await fetchOphimList(type, currentPage);
          setTitle(TYPE_TITLES[type] || 'Danh sách phim');
        }

        setMovies(res.items || []);
        setTotalPages(res.totalPages || 1);
        setTotalItems(res.totalItems || 0);
      } catch (err) {
        console.error('Error loading movies:', err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type, slug, currentPage, location.pathname, filters]);

  const handlePageChange = (page) => {
    const params = { page: String(page) };
    if (filters.country) params.country = filters.country;
    if (filters.year) params.year = filters.year;
    if (filters.type) params.type = filters.type;
    if (filters.sort && filters.sort !== '_id') params.sort = filters.sort;
    setSearchParams(params);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    const params = { page: '1' };
    if (newFilters.country) params.country = newFilters.country;
    if (newFilters.year) params.year = newFilters.year;
    if (newFilters.type) params.type = newFilters.type;
    if (newFilters.sort && newFilters.sort !== '_id') params.sort = newFilters.sort;
    setSearchParams(params);
  };

  return (
    <div className="page-content">
      <div className="container">
        <div className="list-header">
          <h1 className="page-title">{title}</h1>
          {totalItems > 0 && (
            <span className="total-count">{totalItems.toLocaleString()} phim</span>
          )}
        </div>

        <FilterBar filters={filters} onChange={handleFilterChange} />

        {loading ? (
          <div className="loading-container"><div className="loading-spinner" /></div>
        ) : movies.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px 0' }}>
            Không tìm thấy phim nào.
          </p>
        ) : (
          <>
            <div className="movie-grid">
              {movies.map(movie => (
                <MovieCard key={movie._id || movie.slug} movie={movie} />
              ))}
            </div>
            <Pagination current={currentPage} total={totalPages} onChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
}

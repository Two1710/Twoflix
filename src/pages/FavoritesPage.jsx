import { Link } from 'react-router-dom';
import { FiHeart, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import MovieCard from '../components/MovieCard';
import './FavoritesPage.css';

export default function FavoritesPage() {
  const { bookmarks, toggleBookmark } = useAuth();

  return (
    <main className="page-content favorites-page">
      <div className="container">
        <div className="favorites-heading">
          <div>
            <span className="favorites-eyebrow"><FiHeart /> TỦ PHIM CỦA BẠN</span>
            <h1 className="page-title">Danh sách yêu thích</h1>
            <p>Lưu lại những bộ phim bạn muốn xem sau.</p>
          </div>
          <span className="total-count">{bookmarks.length} phim</span>
        </div>

        {bookmarks.length ? (
          <div className="movie-grid favorites-grid">
            {bookmarks.map(movie => (
              <div className="favorite-item" key={movie.slug}>
                <MovieCard movie={movie} />
                <button className="favorite-remove" onClick={() => toggleBookmark(movie)} aria-label={`Xóa ${movie.name} khỏi yêu thích`} title="Xóa khỏi yêu thích">
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="favorites-empty">
            <FiHeart />
            <h2>Tủ phim đang trống</h2>
            <p>Chạm vào nút yêu thích ở trang phim để lưu phim vào đây.</p>
            <Link to="/" className="btn-primary btn-rounded">Khám phá phim</Link>
          </div>
        )}
      </div>
    </main>
  );
}

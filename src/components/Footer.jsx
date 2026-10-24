import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <Link to="/" className="footer__logo">
            <img src="/logo.png" alt="RoPhim" className="footer__logo-img" />
          </Link>
          <p className="footer__desc">
            Xem phim online miễn phí chất lượng cao với phụ đề tiếng Việt - Vietsub, Thuyết minh. 
            Cập nhật nhanh nhất các bộ phim mới nhất.
          </p>
        </div>
        <div className="footer__links">
          <div className="footer__col">
            <h4>Danh Mục</h4>
            <Link to="/danh-sach/phim-bo">Phim Bộ</Link>
            <Link to="/danh-sach/phim-le">Phim Lẻ</Link>
            <Link to="/danh-sach/hoat-hinh">Hoạt Hình</Link>
            <Link to="/danh-sach/tv-shows">TV Shows</Link>
          </div>
          <div className="footer__col">
            <h4>Thể Loại</h4>
            <Link to="/the-loai/hanh-dong">Hành Động</Link>
            <Link to="/the-loai/tinh-cam">Tình Cảm</Link>
            <Link to="/the-loai/hai-huoc">Hài Hước</Link>
            <Link to="/the-loai/kinh-di">Kinh Dị</Link>
          </div>
          <div className="footer__col">
            <h4>Quốc Gia</h4>
            <Link to="/quoc-gia/han-quoc">Hàn Quốc</Link>
            <Link to="/quoc-gia/trung-quoc">Trung Quốc</Link>
            <Link to="/quoc-gia/au-my">Âu Mỹ</Link>
            <Link to="/quoc-gia/nhat-ban">Nhật Bản</Link>
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 Twoflix</p>
        </div>
      </div>
    </footer>
  );
}

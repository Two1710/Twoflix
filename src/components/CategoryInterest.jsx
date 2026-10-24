import { Link } from 'react-router-dom';
import './CategoryInterest.css';

const CATEGORIES = [
  { label: 'Phim Hàn Quốc', slug: 'han-quoc', type: 'quoc-gia', gradient: 'var(--gradient-purple)' },
  { label: 'Phim Trung Quốc', slug: 'trung-quoc', type: 'quoc-gia', gradient: 'var(--gradient-pink)' },
  { label: 'Phim Hành Động', slug: 'hanh-dong', type: 'the-loai', gradient: 'var(--gradient-fire)' },
  { label: 'Phim Tình Cảm', slug: 'tinh-cam', type: 'the-loai', gradient: 'var(--gradient-lavender)' },
  { label: 'Phim Viễn Tưởng', slug: 'vien-tuong', type: 'the-loai', gradient: 'var(--gradient-ocean)' },
  { label: 'Phim Kinh Dị', slug: 'kinh-di', type: 'the-loai', gradient: 'var(--gradient-sunset)' },
];

export default function CategoryInterest() {
  return (
    <div className="category-interest">
      <h2 className="ci-title">Bạn <span className="highlight-gold">đang quan tâm</span> gì?</h2>
      <div className="ci-grid">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            to={`/${cat.type}/${cat.slug}`}
            className="ci-card"
            style={{ background: cat.gradient }}
          >
            <span className="ci-label">{cat.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

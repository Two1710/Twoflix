import './Pagination.css';

export default function Pagination({ current = 1, total = 1, onChange }) {
  if (total <= 1) return null;

  const pages = [];
  const range = 2;
  let start = Math.max(1, current - range);
  let end = Math.min(total, current + range);
  if (current <= range) end = Math.min(total, range * 2 + 1);
  if (current > total - range) start = Math.max(1, total - range * 2);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total) {
    if (end < total - 1) pages.push('...');
    pages.push(total);
  }

  return (
    <div className="pagination">
      <button className="pagination__btn" disabled={current <= 1}
              onClick={() => onChange(current - 1)}>‹</button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="pagination__dots">…</span>
        ) : (
          <button key={p} className={`pagination__btn ${p === current ? 'pagination__btn--active' : ''}`}
                  onClick={() => onChange(p)}>{p}</button>
        )
      )}
      <button className="pagination__btn" disabled={current >= total}
              onClick={() => onChange(current + 1)}>›</button>
    </div>
  );
}

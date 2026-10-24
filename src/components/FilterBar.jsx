import { useState, useEffect } from 'react';
import { fetchGenres, fetchCountries } from '../services/api';
import { FiFilter, FiX } from 'react-icons/fi';
import './FilterBar.css';

const YEARS = [];
for (let y = 2026; y >= 2000; y--) YEARS.push(y);

const SORT_OPTIONS = [
  { value: '_id', label: 'Mới nhất' },
  { value: 'year', label: 'Năm phát hành' },
  { value: 'modified.time', label: 'Cập nhật gần đây' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'series', label: 'Phim Bộ' },
  { value: 'single', label: 'Phim Lẻ' },
  { value: 'hoathinh', label: 'Hoạt Hình' },
  { value: 'tvshows', label: 'TV Shows' },
];

export default function FilterBar({ filters, onChange }) {
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchGenres().then(r => { if (r.data?.items) setGenres(r.data.items); });
    fetchCountries().then(r => { if (r.data?.items) setCountries(r.data.items); });
  }, []);

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({ country: '', year: '', type: '', sort: '_id' });
  };

  const hasFilters = filters.country || filters.year || filters.type || filters.sort !== '_id';

  return (
    <div className="filter-bar">
      <div className="filter-bar__header">
        <button className="filter-toggle" onClick={() => setExpanded(!expanded)}>
          <FiFilter /> Bộ lọc
          {hasFilters && <span className="filter-count">●</span>}
        </button>
        {hasFilters && (
          <button className="filter-clear" onClick={clearFilters}>
            <FiX /> Xóa lọc
          </button>
        )}
      </div>

      {expanded && (
        <div className="filter-bar__body">
          <div className="filter-group">
            <label>Quốc gia</label>
            <select value={filters.country || ''} onChange={e => handleChange('country', e.target.value)}>
              <option value="">Tất cả</option>
              {countries.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Năm</label>
            <select value={filters.year || ''} onChange={e => handleChange('year', e.target.value)}>
              <option value="">Tất cả</option>
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Loại phim</label>
            <select value={filters.type || ''} onChange={e => handleChange('type', e.target.value)}>
              {TYPE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sắp xếp</label>
            <select value={filters.sort || '_id'} onChange={e => handleChange('sort', e.target.value)}>
              {SORT_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

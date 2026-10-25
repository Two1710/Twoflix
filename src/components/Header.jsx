import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { fetchOphimGenres, fetchOphimCountries } from '../services/ophim';
import './Header.css';

const NAV_ITEMS = [
  { label: 'Phim Mới', path: '/danh-sach/phim-moi-cap-nhat', badge: 'MỚI', badgeClass: 'badge-new' },
  { label: 'Thể loại', path: '/the-loai', isDropdown: 'genre' },
  { label: 'Phim Lẻ', path: '/danh-sach/phim-le' },
  { label: 'Phim Bộ', path: '/danh-sach/phim-bo' },
  { label: 'Hoạt Hình', path: '/danh-sach/hoat-hinh' },
  { label: 'TV Shows', path: '/danh-sach/tv-shows' },
  { label: 'Yêu thích', path: '/yeu-thich' },
  { label: 'Quốc gia', path: '/quoc-gia', isDropdown: 'country' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [countries, setCountries] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Load genres and countries from Ophim for real Vietnamese movie categories
    fetchOphimGenres().then(items => setGenres(items));
    fetchOphimCountries().then(items => setCountries(items));
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const t = setTimeout(() => mobileSearchRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [mobileOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    const keyword = searchQuery.trim();
    navigate(keyword ? `/tim-kiem?keyword=${encodeURIComponent(keyword)}` : '/tim-kiem');
    setMobileOpen(false);
  };

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="header__inner">
        {/* Mobile menu button */}
        <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
          <FiMenu />
        </button>

        {/* Logo */}
        <Link to="/" className="header__logo">
          <img src="/logo.png" alt="RoPhim" className="logo-img" />
        </Link>

        {/* Search bar - always visible on desktop */}
        <form className="header__search" onSubmit={handleSearch}>
          <button type="submit" className="search-submit" aria-label="Tìm kiếm">
            <FiSearch className="search-icon" />
          </button>
          <input
            ref={searchRef}
            type="text"
            placeholder="Tìm kiếm phim, diễn viên"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Nav + Member */}
        <nav className={`header__nav ${mobileOpen ? 'header__nav--open' : ''}`}>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <FiX />
          </button>

          {/* Mobile search */}
          <form className="mobile-search" onSubmit={handleSearch}>
            <button type="submit" className="search-submit" aria-label="Tìm kiếm">
              <FiSearch />
            </button>
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </form>

          <ul className="nav-list">
            {NAV_ITEMS.map(item => {
              if (item.isDropdown === 'genre') {
                return (
                  <li key="genre" className="nav-item nav-item--dropdown"
                      onMouseEnter={() => setDropdownOpen('genre')}
                      onMouseLeave={() => setDropdownOpen(null)}>
                    <span className="nav-dropdown-trigger">
                      Thể loại <FiChevronDown />
                    </span>
                    {dropdownOpen === 'genre' && (
                      <div className="dropdown-menu">
                        {genres.map(g => (
                          <Link key={g.slug} to={`/the-loai/${g.slug}`}
                                onClick={() => { setDropdownOpen(null); setMobileOpen(false); }}>
                            {g.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              }
              if (item.isDropdown === 'country') {
                return (
                  <li key="country" className="nav-item nav-item--dropdown"
                      onMouseEnter={() => setDropdownOpen('country')}
                      onMouseLeave={() => setDropdownOpen(null)}>
                    <span className="nav-dropdown-trigger">
                      Quốc gia <FiChevronDown />
                    </span>
                    {dropdownOpen === 'country' && (
                      <div className="dropdown-menu">
                        {countries.map(c => (
                          <Link key={c.slug} to={`/quoc-gia/${c.slug}`}
                                onClick={() => { setDropdownOpen(null); setMobileOpen(false); }}>
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                );
              }
              return (
                <li key={item.path} className="nav-item">
                  <Link to={item.path} onClick={() => setMobileOpen(false)} className={item.isButton ? 'nav-item-button' : ''}>
                    {item.label}
                    {item.badge && <span className={`badge ${item.badgeClass} nav-badge`}>{item.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Mobile search toggle */}
        <button className="mobile-search-toggle" onClick={() => setMobileOpen(true)}>
          <FiSearch />
        </button>
      </div>
      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}
    </header>
  );
}

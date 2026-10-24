import { useCallback, useEffect, useState } from 'react';
import { FiArrowDown, FiArrowUp, FiBell, FiLock, FiLogOut, FiPlus, FiSearch, FiSend, FiTrash2 } from 'react-icons/fi';
import { searchOphim } from '../services/ophim';
import './AdminPage.css';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState(null);
  const [hotMovies, setHotMovies] = useState([]);
  const [hotQuery, setHotQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hotSaving, setHotSaving] = useState(false);
  const [hotDirty, setHotDirty] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAnnouncement = useCallback(async () => {
    const response = await fetch('/api/announcement', { credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải thông báo.');
    setAnnouncement(data.announcement);
    setMessage(data.announcement?.message || '');
  }, []);

  const loadHotMovies = useCallback(async () => {
    const response = await fetch('/api/hot-movies', { credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải danh sách phim hot.');
    setHotMovies(data.movies || []);
    setHotDirty(false);
  }, []);

  useEffect(() => {
    fetch('/api/admin-auth', { credentials: 'same-origin' })
      .then(response => response.json())
      .then(async auth => {
        setAuthenticated(auth.authenticated === true);
        if (auth.authenticated) await Promise.all([loadAnnouncement(), loadHotMovies()]);
      })
      .catch(cause => setError(cause.message || 'Không thể kết nối máy chủ quản trị.'))
      .finally(() => setChecking(false));
  }, [loadAnnouncement, loadHotMovies]);

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Đăng nhập thất bại.');
      setAuthenticated(true);
      setPassword('');
      await Promise.all([loadAnnouncement(), loadHotMovies()]);
    } catch (cause) {
      setError(cause.message || 'Không thể kết nối máy chủ quản trị.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin-auth', { method: 'DELETE', credentials: 'same-origin' });
    setAuthenticated(false);
  }

  async function saveAnnouncement(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/api/announcement', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể đăng thông báo.');
      setAnnouncement(data.announcement);
    } catch (cause) {
      setError(cause.message || 'Không thể đăng thông báo.');
    } finally {
      setSaving(false);
    }
  }

  async function clearAnnouncement() {
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/api/announcement', { method: 'DELETE', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể gỡ thông báo.');
      setAnnouncement(null);
      setMessage('');
    } catch (cause) {
      setError(cause.message || 'Không thể gỡ thông báo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleHotSearch(event) {
    event.preventDefault();
    const keyword = hotQuery.trim();
    if (!keyword) return;
    setError('');
    setSearching(true);
    try {
      const results = await searchOphim(keyword, 1);
      setSearchResults(results.items || []);
      if (!results.items?.length) setError('Không tìm thấy phim phù hợp.');
    } catch (cause) {
      setError(cause.message || 'Không thể tìm phim.');
    } finally {
      setSearching(false);
    }
  }

  function addHotMovie(movie) {
    if (hotMovies.some(item => item.slug === movie.slug)) return;
    if (hotMovies.length >= 12) {
      setError('Danh sách phim hot tối đa 12 phim.');
      return;
    }
    setHotMovies(previous => [...previous, movie]);
    setHotDirty(true);
  }

  function removeHotMovie(index) {
    setHotMovies(previous => previous.filter((_, itemIndex) => itemIndex !== index));
    setHotDirty(true);
  }

  function moveHotMovie(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= hotMovies.length) return;
    setHotMovies(previous => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setHotDirty(true);
  }

  async function saveHotMovies() {
    setError('');
    setHotSaving(true);
    try {
      const response = await fetch('/api/hot-movies', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies: hotMovies }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể lưu danh sách phim hot.');
      setHotMovies(data.movies || []);
      setHotDirty(false);
    } catch (cause) {
      setError(cause.message || 'Không thể lưu danh sách phim hot.');
    } finally {
      setHotSaving(false);
    }
  }

  if (checking) return <main className="admin-page"><div className="admin-panel">Đang tải trang quản trị…</div></main>;

  if (!authenticated) return (
    <main className="admin-page">
      <form className="admin-panel admin-login" onSubmit={handleLogin}>
        <div className="admin-icon"><FiLock /></div>
        <p className="admin-eyebrow">TWOFIX CONTROL</p>
        <h1>Đăng nhập quản trị</h1>
        <p className="admin-description">Nhập tài khoản quản trị để gửi thông báo đến website.</p>
        <label>Tên đăng nhập<input autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} required /></label>
        <label>Mật khẩu<input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <button className="admin-submit" disabled={saving}>{saving ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
      </form>
    </main>
  );

  return (
    <main className="admin-page">
      <section className="admin-panel admin-dashboard">
        <div className="admin-heading">
          <div><p className="admin-eyebrow">TWOFIX CONTROL</p><h1>Thông báo website</h1><p className="admin-description">Thông báo đã đăng sẽ hiển thị cho khách truy cập.</p></div>
          <button className="admin-logout" onClick={handleLogout}><FiLogOut /> Đăng xuất</button>
        </div>
        <section className="admin-hot-movies">
          <div className="admin-hot-heading">
            <div><h2>Phim hot trên trang chủ</h2><p>Chọn tối đa 12 phim và sắp xếp thứ tự hiển thị.</p></div>
            <button className="admin-submit admin-submit--inline" onClick={saveHotMovies} disabled={!hotDirty || hotSaving}>
              <FiSend /> {hotSaving ? 'Đang lưu…' : 'Lưu phim hot'}
            </button>
          </div>
          <form className="admin-hot-search" onSubmit={handleHotSearch}>
            <FiSearch />
            <input value={hotQuery} onChange={event => setHotQuery(event.target.value)} placeholder="Tìm phim theo tên…" aria-label="Tìm phim hot" />
            <button type="submit" disabled={searching || !hotQuery.trim()}>{searching ? 'Đang tìm…' : 'Tìm phim'}</button>
          </form>
          {searchResults.length > 0 && <div className="admin-hot-results">
            {searchResults.slice(0, 8).map(movie => {
              const added = hotMovies.some(item => item.slug === movie.slug);
              return <div className="admin-hot-result" key={movie.slug}>
                <img src={movie.thumb_url || movie.poster_url} alt="" />
                <span><strong>{movie.name}</strong><small>{movie.year || '—'} · {movie.quality || 'HD'}</small></span>
                <button type="button" onClick={() => addHotMovie(movie)} disabled={added || hotMovies.length >= 12} aria-label={`Thêm ${movie.name}`}>
                  {added ? 'Đã thêm' : <><FiPlus /> Thêm</>}
                </button>
              </div>;
            })}
          </div>}
          <div className="admin-hot-list">
            {hotMovies.length === 0 ? <p className="admin-hot-empty">Chưa có phim nào được chọn.</p> : hotMovies.map((movie, index) => (
              <div className="admin-hot-item" key={movie.slug}>
                <span className="admin-hot-order">{index + 1}</span>
                <img src={movie.thumb_url || movie.poster_url} alt="" />
                <span className="admin-hot-title"><strong>{movie.name}</strong><small>{movie.year || '—'} · {movie.quality || 'HD'}</small></span>
                <div className="admin-hot-actions">
                  <button type="button" onClick={() => moveHotMovie(index, -1)} disabled={index === 0} aria-label="Chuyển lên"><FiArrowUp /></button>
                  <button type="button" onClick={() => moveHotMovie(index, 1)} disabled={index === hotMovies.length - 1} aria-label="Chuyển xuống"><FiArrowDown /></button>
                  <button type="button" onClick={() => removeHotMovie(index)} aria-label={`Xóa ${movie.name}`}><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
          {hotDirty && <p className="admin-hot-unsaved">Có thay đổi chưa lưu.</p>}
        </section>
        {announcement && <div className="admin-current-notice"><FiBell /><span><strong>Thông báo đang hiển thị</strong>{announcement.message}</span></div>}
        <form className="admin-notice-form" onSubmit={saveAnnouncement}>
          <label htmlFor="announcement-message">Nội dung thông báo</label>
          <textarea id="announcement-message" maxLength={500} rows={5} value={message} onChange={event => setMessage(event.target.value)} placeholder="Nhập nội dung muốn thông báo cho mọi người…" required />
          <div className="admin-form-footer"><small>{message.length}/500 ký tự</small><div>
            {announcement && <button type="button" className="admin-delete" onClick={clearAnnouncement} disabled={saving}><FiTrash2 /> Gỡ thông báo</button>}
            <button className="admin-submit admin-submit--inline" disabled={saving || !message.trim()}><FiSend /> {saving ? 'Đang lưu…' : 'Đăng thông báo'}</button>
          </div></div>
        </form>
        {error && <p className="admin-error" role="alert">{error}</p>}
      </section>
    </main>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchOphimDetail, fetchOphimList, getOphimImageUrl } from '../services/ophim';
import { getImageUrl } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import MovieCard from '../components/MovieCard';
import HlsPlayer from '../components/HlsPlayer';
import { parseJsonResponse } from '../utils/parseJsonResponse';
import {
  FiPlay, FiHeart, FiStar, FiChevronLeft, FiList,
  FiFlag, FiUser, FiVideo, FiX, FiShare2, FiDownload,
  FiChevronDown, FiChevronUp, FiExternalLink, FiUsers
} from 'react-icons/fi';
import './MovieDetailPage.css';

const TMDB_KEY = '051675f9cf39c424859f3e0aa5fcfd85';
const TMDB_BASE = 'https://api.themoviedb.org/3';

export default function MovieDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleBookmark, isBookmarked, addToHistory } = useAuth();

  const [movie, setMovie] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [activeServer, setActiveServer] = useState(0);
  const [activeEp, setActiveEp] = useState(null);
  const [lightsOff, setLightsOff] = useState(false);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tmdb, setTmdb] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showAllEps, setShowAllEps] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomError, setRoomError] = useState('');

  useEffect(() => {
    fetch('/api/admin-auth', { credentials: 'same-origin' })
      .then(response => response.ok ? parseJsonResponse(response, 'Xác thực quản trị') : null)
      .then(data => setIsAdmin(data?.authenticated === true))
      .catch(() => setIsAdmin(false));
  }, []);

  async function createWatchRoom() {
    if (!isAdmin || !movie || !activeEp?.link_m3u8 || creatingRoom) return;
    setCreatingRoom(true);
    setRoomError('');
    try {
      const response = await fetch('/api/watch-room', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          movieSlug: movie.slug,
          title: movie.name,
          episode: activeEp.name || 'Full',
          sourceUrl: activeEp.link_m3u8,
          fallbackUrl: activeEp.link_embed,
          poster: movie.poster_url || movie.thumb_url,
        }),
      });
      const data = await parseJsonResponse(response, 'Máy chủ phòng xem');
      if (!response.ok) throw new Error(data.error || 'Không thể tạo phòng xem chung.');
      navigate(`/xem-chung/${data.room.code}`);
    } catch (error) {
      setRoomError(error.message || 'Không thể tạo phòng xem chung.');
    } finally {
      setCreatingRoom(false);
    }
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setActiveEp(null);
    setActiveServer(0);
    setTmdb(null);
    setShowAllEps(false);

    async function load() {
      try {
        const result = await fetchOphimDetail(slug);
        if (!result?.movie) { setMovie(null); setLoading(false); return; }

        const { movie: m, episodes: rawEps } = result;
        setMovie(m);

        // Filter out servers/episodes with no valid links
        const eps = rawEps.map(server => ({
          ...server,
          server_data: (server.server_data || []).filter(
            ep => ep.link_m3u8 || ep.link_embed
          )
        })).filter(server => server.server_data.length > 0);

        setEpisodes(eps);

        // Auto-select first valid episode
        if (eps.length > 0 && eps[0].server_data?.length > 0) {
          setActiveEp(eps[0].server_data[0]);
        }

        // Fetch TMDB enrichment for better metadata + trailer
        if (m.tmdb_id) {
          const tmdbType = m.tmdb_type === 'tv' ? 'tv' : 'movie';
          fetch(`${TMDB_BASE}/${tmdbType}/${m.tmdb_id}?api_key=${TMDB_KEY}&append_to_response=videos,credits,images&language=vi-VN`)
            .then(r => r.ok ? parseJsonResponse(r, 'Dữ liệu phim') : null)
            .then(data => {
              if (data) {
                // If we got no videos from vi-VN, fetch en-US videos
                if (!data.videos?.results?.length) {
                  return fetch(`${TMDB_BASE}/${tmdbType}/${m.tmdb_id}/videos?api_key=${TMDB_KEY}&language=en-US`)
                    .then(r => parseJsonResponse(r, 'Dữ liệu trailer'))
                    .then(vids => { data.videos = vids; return data; });
                }
                return data;
              }
            })
            .then(data => { if (data) setTmdb(data); })
            .catch(console.error);
        }

        // Fetch related movies
        const type = m.type === 'single' ? 'phim-le' : 'phim-bo';
        const relRes = await fetchOphimList(type);
        setRelated(relRes.items.filter(r => r.slug !== slug).slice(0, 12));
      } catch (err) {
        console.error('Error loading movie:', err);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Track watch history
  useEffect(() => {
    if (movie && activeEp) {
      addToHistory(movie, activeEp.name || '1');
    }
  }, [movie, activeEp]);

  const handlePlayEp = (ep) => {
    setActiveEp(ep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="page-content">
        <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
          <p style={{ fontSize: '20px', color: 'var(--text-muted)' }}>Không tìm thấy phim.</p>
          <Link to="/" style={{ color: 'var(--accent)', marginTop: '16px', display: 'inline-block' }}>← Về trang chủ</Link>
        </div>
      </div>
    );
  }

  const backdrop = tmdb?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path}`
    : movie.thumb_url;

  const poster = tmdb?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`
    : movie.poster_url;

  const trailer = tmdb?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || tmdb?.videos?.results?.[0];

  const cast = tmdb?.credits?.cast?.slice(0, 10) || [];
  const currentServerEps = episodes[activeServer]?.server_data || [];
  const displayedEps = showAllEps ? currentServerEps : currentServerEps.slice(0, 50);
  const isCompleted = (movie.episode_current || '').toLowerCase().includes('hoàn tất')
    || (movie.episode_current || '').toLowerCase().includes('full');

  const embedSrc = activeEp?.link_embed || '';
  // Prefer provider embed player for maximum desktop compatibility.
  const hlsSrc = embedSrc ? '' : (activeEp?.link_m3u8 || '');

  return (
    <div className={`movie-detail ${lightsOff ? 'lights-off' : ''}`}>

      {/* Backdrop Hero */}
      <div className="md-hero" style={{ backgroundImage: `url(${backdrop})` }}>
        <div className="md-hero__gradient" />
      </div>

      <div className="md-page">

        {/* Title Bar */}
        <div className="md-titlebar">
          <div className="md-titlebar-inner">
            <button className="md-back" onClick={() => navigate(-1)}><FiChevronLeft /></button>
            <span className="md-titlebar-text">Xem phim {movie.name}</span>
            <span className="md-titlebar-ep">
              {activeEp && (activeEp.name === 'Full' ? 'Full' : `Phần 1 - ${activeEp.name}`)}
            </span>
          </div>
        </div>

        {/* Player */}
        <div className="md-player-section">
          <div className="md-player">
            {(hlsSrc || embedSrc) ? (
              <HlsPlayer
                key={`${hlsSrc}||${embedSrc}`}
                src={hlsSrc}
                embedSrc={embedSrc}
                title={`${movie.name}${activeEp?.name && activeEp.name !== 'Full' ? ` - ${activeEp.name}` : ''}`}
                poster={backdrop}
              />
            ) : (
              <div className="md-player-empty">
                <FiPlay style={{ fontSize: 56, opacity: 0.3 }} />
                <span>Chọn tập để bắt đầu xem phim</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Bar */}
        <div className="md-action-bar">
          <div className="md-action-inner">
            <div className="md-action-left">
              {isAdmin && activeEp?.link_m3u8 && (
                <button className="md-action-item md-watch-room-create" onClick={createWatchRoom} disabled={creatingRoom}>
                  <FiUsers />
                  <span>{creatingRoom ? 'Đang tạo phòng…' : 'Tạo phòng xem chung'}</span>
                </button>
              )}
              <button
                className={`md-action-item ${isBookmarked(movie.slug) ? 'bookmarked' : ''}`}
                onClick={() => toggleBookmark(movie)}
              >
                <FiHeart style={isBookmarked(movie.slug) ? { fill: '#ef4444', color: '#ef4444' } : {}} />
                <span>{isBookmarked(movie.slug) ? 'Đã thích' : 'Yêu thích'}</span>
              </button>

              <button className="md-action-item" onClick={() => setLightsOff(!lightsOff)}>
                <span>{lightsOff ? '💡' : '🌙'}</span>
                <span>Tắt đèn</span>
                <span className={`md-toggle ${lightsOff ? 'md-toggle--on' : ''}`}>
                  {lightsOff ? 'ON' : 'OFF'}
                </span>
              </button>

              {trailer && (
                <button className="md-action-item" onClick={() => setShowTrailer(true)}>
                  <FiVideo />
                  <span>Trailer</span>
                </button>
              )}

              <button className="md-action-item" onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}>
                <FiShare2 />
                <span>Chia sẻ</span>
              </button>

              <button className="md-action-item">
                <FiFlag />
                <span>Báo lỗi</span>
              </button>
            </div>
            {roomError && <div className="md-watch-room-error" role="alert">{roomError}</div>}
            {activeEp && (
              <div className="md-current-ep">
                Đang xem: {activeEp.name === 'Full' ? 'Full' : ` ${activeEp.name}`}
              </div>
            )}
          </div>
        </div>

        {/* Main Layout */}
        <div className="md-main-layout">
          <div className="md-main-col">

            {/* Movie Info */}
            <div className="md-info-section">
              <div className="md-info-compact">
                <div className="md-info-poster">
                  <img src={poster} alt={movie.name} />
                </div>
                <div className="md-info-text">
                  <h1 className="md-movie-title">{movie.name}</h1>
                  <p className="md-movie-origin">{movie.origin_name}</p>

                  <div className="md-badges">
                    {tmdb?.vote_average > 0 && (
                      <span className="md-badge md-badge--imdb">
                        <FiStar style={{ marginRight: 4 }} />
                        {tmdb.vote_average.toFixed(1)}
                      </span>
                    )}
                    {movie.year && <span className="md-badge">{movie.year}</span>}
                    {movie.time && <span className="md-badge">{movie.time}</span>}
                    {movie.quality && <span className="md-badge md-badge--quality">{movie.quality}</span>}
                    {movie.lang && <span className="md-badge md-badge--lang">{movie.lang}</span>}
                    <span className={`md-badge ${isCompleted ? 'md-badge--done' : 'md-badge--ongoing'}`}>
                      {isCompleted ? '✓ Hoàn Tất' : movie.episode_current}
                    </span>
                  </div>

                  {/* Genre tags */}
                  {movie.category?.length > 0 && (
                    <div className="md-genre-tags">
                      {movie.category.map(c => (
                        <Link key={c.slug} to={`/the-loai/${c.slug}`} className="md-genre-tag">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="md-meta-grid">
                    {movie.country?.length > 0 && (
                      <div className="md-meta-item">
                        <span className="md-meta-label">Quốc gia:</span>
                        <span className="md-meta-value">
                          {movie.country.map((c, i) => (
                            <span key={c.slug}>
                              <Link to={`/quoc-gia/${c.slug}`}>{c.name}</Link>
                              {i < movie.country.length - 1 && ', '}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                    {movie.director?.length > 0 && (
                      <div className="md-meta-item">
                        <span className="md-meta-label">Đạo diễn:</span>
                        <span className="md-meta-value">{movie.director.join(', ')}</span>
                      </div>
                    )}
                    {movie.actor?.length > 0 && (
                      <div className="md-meta-item">
                        <span className="md-meta-label">Diễn viên:</span>
                        <span className="md-meta-value">{movie.actor.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {movie.content && (
                <div className="md-info-bottom">
                  <div className={`md-description ${showDesc ? 'md-description--expanded' : ''}`}>
                    <p>{movie.content}</p>
                  </div>
                  {movie.content.length > 200 && (
                    <button className="md-desc-toggle" onClick={() => setShowDesc(!showDesc)}>
                      {showDesc ? <><FiChevronUp /> Thu gọn</> : <><FiChevronDown /> Xem thêm</>}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Episodes / Các bản chiếu ────────────────────── */}
            {episodes.length > 0 && (
              <div className="md-episodes-section">

                {/* Multiple servers → "Các bản chiếu" card grid */}
                {episodes.length > 1 && (
                  <div className="md-versions-wrap">
                    <h3 className="md-section-title">Các bản chiếu</h3>
                    <div className="md-versions-grid">
                      {episodes.map((server, idx) => (
                        <button
                          key={idx}
                          className={`md-version-card ${activeServer === idx ? 'md-version-card--active' : ''}`}
                          onClick={() => {
                            setActiveServer(idx);
                            // Auto-select first episode of this server
                            if (server.server_data?.length > 0) {
                              handlePlayEp(server.server_data[0]);
                            }
                          }}
                        >
                          <div className="md-version-thumb">
                            <img src={poster} alt={movie.name} />
                            <div className="md-version-overlay">
                              <FiPlay className="md-version-play" />
                            </div>
                            <span className="md-version-server-badge">{server.server_name}</span>
                          </div>
                          <div className="md-version-info">
                            <p className="md-version-title">{movie.name}</p>
                            <button className="md-version-cta">Xem bản này</button>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Server tab strip (only show if multiple servers) */}
                {episodes.length > 1 && (
                  <div className="md-server-strip">
                    {episodes.map((server, idx) => (
                      <button
                        key={idx}
                        className={`md-server-pill ${activeServer === idx ? 'active' : ''}`}
                        onClick={() => setActiveServer(idx)}
                      >
                        {server.server_name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Episode grid for selected server */}
                <div className="md-ep-header">
                  <h3 className="md-section-title">
                    <FiList /> {episodes.length === 1 ? 'Danh sách tập' : episodes[activeServer]?.server_name}
                  </h3>
                  <span className="md-ep-count">
                    {currentServerEps.length} tập
                  </span>
                </div>

                <div className="md-episode-grid">
                  {displayedEps.map((ep, idx) => (
                    <button
                      key={`${ep.slug}-${idx}`}
                      className={`md-ep-btn ${
                        activeEp?.slug === ep.slug && activeEp?.name === ep.name
                          ? 'md-ep-btn--active' : ''
                      }`}
                      onClick={() => handlePlayEp(ep)}
                    >
                      {activeEp?.slug === ep.slug && activeEp?.name === ep.name && (
                        <FiPlay className="md-ep-play" />
                      )}
                      <span>{ep.name === 'Full' ? 'Full' : ` ${ep.name}`}</span>
                    </button>
                  ))}
                </div>

                {currentServerEps.length > 50 && (
                  <button className="md-show-more" onClick={() => setShowAllEps(!showAllEps)}>
                    {showAllEps ? 'Thu gọn' : `Xem thêm ${currentServerEps.length - 50} tập`}
                  </button>
                )}
              </div>
            )}

            {/* Related */}
            {related.length > 0 && (
              <div className="md-related-section">
                <h3 className="md-section-title">Phim Liên Quan</h3>
                <div className="md-related-grid">
                  {related.map(m => <MovieCard key={m._id || m.slug} movie={m} />)}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="md-sidebar-col">
            {/* Cast from TMDB */}
            {cast.length > 0 && (
              <div className="md-sidebar-widget">
                <h3 className="md-sidebar-title">Top Diễn Viên</h3>
                <div className="md-actor-list">
                  {cast.slice(0, 6).map(actor => (
                    <div key={actor.id} className="md-actor-item">
                      <div className="md-actor-avatar">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                          />
                        ) : (
                          <FiUser />
                        )}
                      </div>
                      <div className="md-actor-info">
                        <div className="md-actor-name">{actor.name}</div>
                        <div className="md-actor-role">{actor.character || 'Diễn viên'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TMDB score */}
            {tmdb?.vote_average > 0 && (
              <div className="md-sidebar-widget">
                <h3 className="md-sidebar-title">Đánh Giá</h3>
                <div className="md-score-display">
                  <div className="md-score-circle">
                    <span className="md-score-num">{tmdb.vote_average.toFixed(1)}</span>
                    <span className="md-score-label">/ 10</span>
                  </div>
                  <div className="md-score-meta">
                    <p>TMDB Score</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {tmdb.vote_count?.toLocaleString()} lượt đánh giá
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer && (
        <div className="md-trailer-modal" onClick={() => setShowTrailer(false)}>
          <div className="md-trailer-content" onClick={e => e.stopPropagation()}>
            <button className="md-trailer-close" onClick={() => setShowTrailer(false)}>
              <FiX />
            </button>
            <div className="md-trailer-video">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

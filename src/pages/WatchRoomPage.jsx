import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiCopy, FiLoader, FiUsers, FiX } from 'react-icons/fi';
import HlsPlayer from '../components/HlsPlayer';
import { parseJsonResponse } from '../utils/parseJsonResponse';
import './WatchRoomPage.css';

export default function WatchRoomPage() {
  const { code: routeCode } = useParams();
  const code = (routeCode || '').toUpperCase();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [closing, setClosing] = useState(false);
  const [playerMode, setPlayerMode] = useState('loading');
  const publishQueueRef = useRef(Promise.resolve());

  const loadRoom = useCallback(async (quiet = false) => {
    try {
      const response = await fetch(`/api/watch-room?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
      const data = await parseJsonResponse(response, 'Máy chủ phòng xem');
      if (!response.ok) throw new Error(data.error || 'Không tìm thấy phòng xem.');
      setRoom(current => current?.updatedAt === data.room.updatedAt ? current : data.room);
      setError('');
    } catch (cause) {
      if (!quiet) setError(cause.message || 'Không thể kết nối phòng xem.');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadRoom();
    const timer = window.setInterval(() => loadRoom(true), 2500);
    fetch('/api/admin-auth', { credentials: 'same-origin' })
      .then(response => response.ok ? parseJsonResponse(response, 'Xác thực quản trị') : null)
      .then(data => setIsAdmin(data?.authenticated === true))
      .catch(() => setIsAdmin(false));
    return () => window.clearInterval(timer);
  }, [loadRoom]);

  const publishPlayback = useCallback(async state => {
    publishQueueRef.current = publishQueueRef.current.then(async () => {
      const response = await fetch('/api/watch-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, ...state }),
      });
      if (!response.ok) throw new Error('Không thể gửi trạng thái phát.');
    }).catch(() => {
      setError('Mất kết nối đồng bộ. Đang thử kết nối lại…');
    });
    return publishQueueRef.current;
  }, [code]);

  const handlePlayerModeChange = useCallback(mode => setPlayerMode(mode), []);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Không thể sao chép tự động. Hãy sao chép đường dẫn trên thanh địa chỉ.');
    }
  }

  async function closeRoom() {
    if (!isAdmin || closing) return;
    setClosing(true);
    try {
      const response = await fetch(`/api/watch-room?code=${encodeURIComponent(code)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const data = await parseJsonResponse(response, 'Máy chủ phòng xem');
      if (!response.ok) throw new Error(data.error || 'Không thể kết thúc phòng.');
      navigate(`/phim/${room.movieSlug}`);
    } catch (cause) {
      setError(cause.message || 'Không thể kết thúc phòng.');
      setClosing(false);
    }
  }

  return (
    <main className="watch-room-page">
      <div className="watch-room-page__glow" />
      <div className="watch-room-content">
        <Link className="watch-room-back" to={room ? `/phim/${room.movieSlug}` : '/'}>
          <FiArrowLeft /> {room ? 'Quay lại phim' : 'Về trang chủ'}
        </Link>

        {loading ? (
          <div className="watch-room-state"><FiLoader className="watch-room-spin" /> Đang kết nối phòng…</div>
        ) : error && !room ? (
          <div className="watch-room-state watch-room-state--error"><FiX /><p>{error}</p><Link to="/">Về trang chủ</Link></div>
        ) : room ? (
          <>
            <header className="watch-room-header">
              <div className="watch-room-heading">
                <div className="watch-room-eyebrow"><span className="watch-room-live" /> PHÒNG XEM CHUNG</div>
                <h1>{room.title}</h1>
                <div className="watch-room-meta">
                  <span className="watch-room-episode">{room.episode}</span>
                  <span className="watch-room-code"><span>MÃ PHÒNG</span><strong>{room.code}</strong></span>
                </div>
              </div>
              <div className="watch-room-actions">
                <button className="watch-room-share" onClick={copyInvite}>
                  {copied ? <FiCheck /> : <FiCopy />}
                  <span>{copied ? 'Đã sao chép link' : 'Sao chép link mời'}</span>
                </button>
                {isAdmin && <button className="watch-room-close" onClick={closeRoom} disabled={closing}><FiX /><span>{closing ? 'Đang đóng…' : 'Kết thúc phòng'}</span></button>}
              </div>
            </header>

            {error && <div className="watch-room-inline-error" role="status">{error}</div>}
            <section className="watch-room-player" aria-label="Trình phát xem chung">
              <HlsPlayer
                key={`${code}:${room.sourceUrl}`}
                src={room.sourceUrl}
                title={`${room.title} - ${room.episode}`}
                poster={room.poster}
                embedSrc={room.fallbackUrl}
                roomState={room}
                onRoomStateChange={publishPlayback}
                onPlayerModeChange={handlePlayerModeChange}
              />
            </section>

            <div className="watch-room-info">
              <span className="watch-room-info__icon"><FiUsers /></span>
              <div className="watch-room-info__copy">
                <strong>Đang xem cùng một phòng</strong>
                <p>Phát, tạm dừng hoặc tua để đồng bộ với mọi người trong phòng.</p>
              </div>
              {playerMode === 'iframe'
                ? <span className="watch-room-sync watch-room-sync--limited">Nguồn dự phòng · không đồng bộ</span>
                : <span className="watch-room-sync"><i /> Đang đồng bộ</span>}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

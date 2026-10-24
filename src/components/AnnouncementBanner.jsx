import { useEffect, useRef, useState } from 'react';
import { FiBell, FiX } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import './AnnouncementBanner.css';

export default function AnnouncementBanner() {
  const { pathname } = useLocation();
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const loadedAt = useRef(null);

  useEffect(() => {
    let active = true;
    const load = () => fetch('/api/announcement', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!active || !data) return;
        const nextUpdatedAt = data.announcement?.updatedAt || null;
        if (nextUpdatedAt !== loadedAt.current) setDismissed(false);
        loadedAt.current = nextUpdatedAt;
        setAnnouncement(data.announcement);
      })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!announcement || dismissed) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [announcement, dismissed]);

  if (pathname !== '/' || !announcement || dismissed) return null;
  return (
    <div className="announcement-overlay" role="presentation">
      <section className="announcement-modal" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
        <button className="announcement-modal__close" onClick={() => setDismissed(true)} aria-label="Đóng thông báo"><FiX /></button>
        <div className="announcement-modal__icon"><FiBell /></div>
        <p className="announcement-modal__eyebrow">THÔNG BÁO TỪ QUẢN TRỊ</p>
        <h2 id="announcement-title">Tin mới dành cho bạn</h2>
        <p className="announcement-modal__message">{announcement.message}</p>
        <button className="announcement-modal__continue" onClick={() => setDismissed(true)}>Đã hiểu, tiếp tục xem</button>
      </section>
    </div>
  );
}

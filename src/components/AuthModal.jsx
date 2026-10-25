import React, { useState } from 'react';
import { FiX, FiClock, FiHeart, FiLogOut, FiPlayCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './AuthModal.css';

export default function AuthModal() {
  const { user, login, logout, showAuthModal, closeAuthModal, history, bookmarks } = useAuth();
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'bookmarks'

  if (!showAuthModal) return null;

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-content" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal}><FiX /></button>
        
        {!user ? (
          <div className="auth-login-box">
            <h2>Đăng nhập / Đăng ký</h2>
            <p>Hệ thống tự động tạo mã định danh riêng trên thiết bị của bạn.</p>
            <form onSubmit={handleLogin} className="auth-form">
              <input 
                type="text" 
                placeholder="Nhập tên hiển thị của bạn..." 
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
              <button type="submit" className="auth-btn">Tham gia</button>
            </form>
          </div>
        ) : (
          <div className="auth-profile-box">
            <div className="auth-profile-header">
              <h2>Xin chào, {user.username}!</h2>
              <button onClick={logout} className="auth-logout-btn"><FiLogOut /> Đăng xuất</button>
            </div>

            <div className="auth-tabs">
              <button 
                className={`auth-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <FiClock /> Lịch sử xem phim
              </button>
              <button 
                className={`auth-tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookmarks')}
              >
                <FiHeart /> Tủ phim của tôi
              </button>
            </div>

            <div className="auth-content-area">
              {activeTab === 'history' && (
                <div className="auth-movie-list">
                  {history.length === 0 ? <p className="auth-empty">Bạn chưa xem bộ phim nào.</p> : history.map((item, idx) => (
                    <div key={idx} className="auth-movie-item">
                      <img src={item.thumb_url} alt={item.name} />
                      <div className="auth-movie-info">
                        <h4>{item.name}</h4>
                        <p className="auth-movie-ep">Đang xem: {item.lastEpisode === 'Full' ? 'Full' : ` ${item.lastEpisode}`}</p>
                      </div>
                      <Link to={`/phim/${item.slug}`} className="auth-movie-play" onClick={closeAuthModal}>
                        <FiPlayCircle />
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'bookmarks' && (
                <div className="auth-movie-list">
                  {bookmarks.length === 0 ? <p className="auth-empty">Tủ phim trống.</p> : bookmarks.map((item, idx) => (
                    <div key={idx} className="auth-movie-item">
                      <img src={item.thumb_url} alt={item.name} />
                      <div className="auth-movie-info">
                        <h4>{item.name}</h4>
                        <p className="auth-movie-date">Thêm ngày: {new Date(item.addedAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <Link to={`/phim/${item.slug}`} className="auth-movie-play" onClick={closeAuthModal}>
                        <FiPlayCircle />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

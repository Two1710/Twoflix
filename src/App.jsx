import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FiChevronUp } from 'react-icons/fi';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import MovieListPage from './pages/MovieListPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SearchPage from './pages/SearchPage';
import FootballPage from './pages/FootballPage';
import FootballLeaguePage from './pages/FootballLeaguePage';
import FootballHighlightsPage from './pages/FootballHighlightsPage';
import AdminPage from './pages/AdminPage';
import FavoritesPage from './pages/FavoritesPage';
import DownloadPage from './pages/DownloadPage';
import AnnouncementBanner from './components/AnnouncementBanner';
import SiteTheme from './components/SiteTheme';
import SeasonalEffects from './components/SeasonalEffects';

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      className={`scroll-top-btn ${visible ? 'visible' : ''}`}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      <FiChevronUp />
      <span>ĐẦU</span>
      <span>TRANG</span>
    </button>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <SiteTheme />
      <SeasonalEffects />
      <AnnouncementBanner />
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/danh-sach/:type" element={<MovieListPage />} />
        <Route path="/the-loai/:slug" element={<MovieListPage />} />
        <Route path="/quoc-gia/:slug" element={<MovieListPage />} />
        <Route path="/phim/:slug" element={<MovieDetailPage />} />
        <Route path="/tim-kiem" element={<SearchPage />} />
        <Route path="/yeu-thich" element={<FavoritesPage />} />
        <Route path="/tai-app" element={<DownloadPage />} />
        <Route path="/bong-da" element={<FootballPage />} />
        <Route path="/bong-da/giai-dau/:leagueId" element={<FootballLeaguePage />} />
        <Route path="/bong-da/highlights" element={<FootballHighlightsPage />} />
      </Routes>
      <Footer />
      <ScrollToTop />
    </BrowserRouter>
  );
}

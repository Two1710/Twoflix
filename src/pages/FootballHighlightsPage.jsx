import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { fetchHighlights } from '../services/footballApi';
import HighlightCard from '../components/HighlightCard';
import './FootballHighlightsPage.css';

export default function FootballHighlightsPage() {
  const [highlights, setHighlights] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [activeComp, setActiveComp] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      try {
        const data = await fetchHighlights();
        setHighlights(data);
        setFiltered(data);

        // Extract unique competitions (use normalized competitionName)
        const comps = [...new Set(data.map(h => h.competitionName).filter(Boolean))];
        setCompetitions(comps);
      } catch (err) {
        console.error('Error loading highlights:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (activeComp === 'all') {
      setFiltered(highlights);
    } else {
      setFiltered(highlights.filter(h => h.competitionName === activeComp));
    }
  }, [activeComp, highlights]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="highlights-header">
          <Link to="/bong-da" className="league-hero__back">
            <FiArrowLeft /> Quay lại
          </Link>
          <h1 className="page-title">Video Highlights Bóng Đá</h1>
          <p className="highlights-subtitle">
            Tổng hợp video highlights và bàn thắng từ các giải đấu hàng đầu
          </p>
        </div>

        {/* Competition Filter */}
        {competitions.length > 0 && (
          <div className="highlights-filter">
            <button
              className={`league-tab ${activeComp === 'all' ? 'league-tab--active' : ''}`}
              onClick={() => setActiveComp('all')}
            >
              Tất cả
            </button>
            {competitions.map(comp => (
              <button
                key={comp}
                className={`league-tab ${activeComp === comp ? 'league-tab--active' : ''}`}
                onClick={() => setActiveComp(comp)}
              >
                {comp}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="highlight-grid highlight-grid--full">
            {filtered.map((hl, i) => (
              <HighlightCard key={i} highlight={hl} />
            ))}
          </div>
        ) : (
          <div className="football-empty">
            Chưa có video highlights
          </div>
        )}
      </div>
    </div>
  );
}

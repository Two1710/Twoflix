import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiCalendar, FiTv, FiPlay } from 'react-icons/fi';
import {
  fetchMatchesRange,
  fetchMatchesByDate,
  fetchHighlights,
  groupEventsByLeague,
  LEAGUES,
  CURRENT_SEASON,
} from '../services/footballApi';
import MatchCard from '../components/MatchCard';
import HighlightCard from '../components/HighlightCard';
import './FootballPage.css';

// Generate date tabs: yesterday, today, tomorrow, +2, +3
function getDateTabs() {
  const tabs = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  for (let i = -1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    let label;
    if (i === -1) label = 'Hôm qua';
    else if (i === 0) label = 'Hôm nay';
    else if (i === 1) label = 'Ngày mai';
    else label = `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
    tabs.push({ key, label, isToday: i === 0 });
  }
  return tabs;
}

export default function FootballPage() {
  const [matchesByDate, setMatchesByDate] = useState({});
  const [highlights, setHighlights] = useState([]);
  const [activeDate, setActiveDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [customDate, setCustomDate] = useState('');

  const dateTabs = getDateTabs();

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      try {
        const [rangeEvents, hlData] = await Promise.all([
          fetchMatchesRange(new Date(), 1, 3),
          fetchHighlights(),
        ]);
        // Group by date
        const byDate = {};
        rangeEvents.forEach(e => {
          const date = e.dateEvent;
          if (!byDate[date]) byDate[date] = [];
          byDate[date].push(e);
        });
        setMatchesByDate(byDate);
        setHighlights(hlData);
      } catch (err) {
        console.error('Error loading football data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch custom date if selected outside the preloaded range
  async function handleDateChange(date) {
    setActiveDate(date);
    if (!matchesByDate[date]) {
      try {
        const events = await fetchMatchesByDate(date);
        setMatchesByDate(prev => ({ ...prev, [date]: events }));
      } catch (err) {
        console.error('Error fetching date:', err);
      }
    }
  }

  function handleCustomDate(e) {
    const val = e.target.value;
    setCustomDate(val);
    if (val) handleDateChange(val);
  }

  const currentMatches = matchesByDate[activeDate] || [];
  const groupedByLeague = groupEventsByLeague(currentMatches);
  const leagueNames = Object.keys(groupedByLeague).sort();

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Hero Banner */}
      <div className="football-hero">
        <div className="football-hero__bg" />
        <div className="container football-hero__content">
          <div className="football-hero__top">
            <div>
              <h1 className="football-hero__title">
                <FiTv className="football-hero__icon" />
                Bóng Đá Trực Tuyến
              </h1>
              <p className="football-hero__desc">
                Lịch thi đấu, kết quả và highlights bóng đá mùa giải {CURRENT_SEASON}
              </p>
            </div>
          </div>

          {/* League Quick Links */}
          <div className="football-leagues-grid">
            {LEAGUES.map(league => (
              <Link key={league.id} to={`/bong-da/giai-dau/${league.id}`} className="league-quick-card">
                <span className="league-quick-card__flag">{league.flag}</span>
                <span className="league-quick-card__name">{league.name}</span>
                <FiChevronRight className="league-quick-card__arrow" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Date Tabs */}
        <div className="section">
          <div className="date-nav">
            <div className="date-nav__tabs">
              {dateTabs.map(tab => (
                <button
                  key={tab.key}
                  className={`date-nav__tab ${activeDate === tab.key ? 'date-nav__tab--active' : ''} ${tab.isToday ? 'date-nav__tab--today' : ''}`}
                  onClick={() => handleDateChange(tab.key)}
                >
                  <span className="date-nav__tab-label">{tab.label}</span>
                  {matchesByDate[tab.key] && (
                    <span className="date-nav__tab-count">{matchesByDate[tab.key].length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="date-nav__custom">
              <FiCalendar />
              <input
                type="date"
                className="football-date-picker"
                value={customDate}
                onChange={handleCustomDate}
              />
            </div>
          </div>

          {/* Matches grouped by league */}
          {leagueNames.length > 0 ? (
            <div className="matches-by-league">
              {leagueNames.map(leagueName => (
                <div key={leagueName} className="league-group">
                  <div className="league-group__header">
                    <span className="league-group__name">{leagueName}</span>
                    <span className="league-group__count">{groupedByLeague[leagueName].length} trận</span>
                  </div>
                  <div className="match-grid">
                    {groupedByLeague[leagueName].map(event => (
                      <MatchCard key={event.idEvent} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="football-empty">
              <FiCalendar style={{ fontSize: '1.5rem', marginBottom: 8 }} />
              <p>Không có trận đấu nào trong ngày {new Date(activeDate).toLocaleDateString('vi-VN')}</p>
              <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Hãy chọn ngày khác hoặc xem lịch thi đấu theo giải</p>
            </div>
          )}
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                <FiPlay style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Video Highlights Mới Nhất
              </h2>
              <Link to="/bong-da/highlights" className="section-link">
                Xem tất cả ({highlights.length}) <FiChevronRight />
              </Link>
            </div>
            <div className="highlight-grid">
              {highlights.slice(0, 8).map((hl, i) => (
                <HighlightCard key={i} highlight={hl} />
              ))}
            </div>
          </div>
        )}

        {/* League Quick Access */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Giải Đấu Hàng Đầu</h2>
          </div>
          <div className="league-cards-grid">
            {LEAGUES.map(league => (
              <Link key={league.id} to={`/bong-da/giai-dau/${league.id}`} className="league-card">
                <div className="league-card__flag">{league.flag}</div>
                <div className="league-card__info">
                  <h3 className="league-card__name">{league.name}</h3>
                  <p className="league-card__country">{league.country}</p>
                </div>
                <div className="league-card__actions">
                  <span className="league-card__link">Xem chi tiết</span>
                  <FiChevronRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

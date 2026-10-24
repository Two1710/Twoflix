import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight, FiCalendar, FiAward, FiList } from 'react-icons/fi';
import {
  fetchLeagueDetails,
  fetchLeagueNextEvents,
  fetchLeaguePastEvents,
  fetchSeasonEvents,
  fetchLeagueTable,
  LEAGUES,
  CURRENT_SEASON,
} from '../services/footballApi';
import MatchCard from '../components/MatchCard';
import './FootballLeaguePage.css';

const TABS = [
  { id: 'upcoming', label: 'Sắp Diễn Ra', icon: FiCalendar },
  { id: 'results', label: 'Kết Quả', icon: FiList },
  { id: 'standings', label: 'Bảng Xếp Hạng', icon: FiAward },
];

export default function FootballLeaguePage() {
  const { leagueId } = useParams();
  const [league, setLeague] = useState(null);
  const [nextEvents, setNextEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [seasonEvents, setSeasonEvents] = useState([]);
  const [standings, setStandings] = useState([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoading(true);
      try {
        const [leagueData, next, past, season, table] = await Promise.all([
          fetchLeagueDetails(leagueId),
          fetchLeagueNextEvents(leagueId),
          fetchLeaguePastEvents(leagueId),
          fetchSeasonEvents(leagueId, CURRENT_SEASON),
          fetchLeagueTable(leagueId, CURRENT_SEASON),
        ]);
        setLeague(leagueData);
        setNextEvents(next);
        setPastEvents(past);
        setSeasonEvents(season);
        setStandings(table);
      } catch (err) {
        console.error('Error loading league:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leagueId]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-container"><div className="loading-spinner" /></div>
      </div>
    );
  }

  const leagueInfo = LEAGUES.find(l => l.id === leagueId);
  const leagueName = league?.strLeague || leagueInfo?.name || 'Giải đấu';

  // Combine season events + past events for results, remove duplicates
  const allFinished = [];
  const seenIds = new Set();
  seasonEvents.forEach(e => {
    if (e.intHomeScore !== null && e.intAwayScore !== null) {
      seenIds.add(e.idEvent);
      allFinished.push(e);
    }
  });
  pastEvents.forEach(e => {
    if (!seenIds.has(e.idEvent) && e.intHomeScore !== null && e.intAwayScore !== null) {
      seenIds.add(e.idEvent);
      allFinished.push(e);
    }
  });
  allFinished.sort((a, b) => {
    const da = new Date(a.dateEvent + 'T' + (a.strTime || '00:00'));
    const db = new Date(b.dateEvent + 'T' + (b.strTime || '00:00'));
    return db - da;
  });

  // Group finished by round
  const groupedByRound = {};
  allFinished.forEach(e => {
    const round = e.intRound || '?';
    if (!groupedByRound[round]) groupedByRound[round] = [];
    groupedByRound[round].push(e);
  });
  const sortedRounds = Object.keys(groupedByRound).sort((a, b) => Number(b) - Number(a));

  // Combine upcoming events
  const allUpcoming = [];
  const seenUpIds = new Set();
  nextEvents.forEach(e => { seenUpIds.add(e.idEvent); allUpcoming.push(e); });
  seasonEvents.forEach(e => {
    if (!seenUpIds.has(e.idEvent) && (e.intHomeScore === null || e.intAwayScore === null)) {
      seenUpIds.add(e.idEvent);
      allUpcoming.push(e);
    }
  });
  allUpcoming.sort((a, b) => {
    const da = new Date(a.dateEvent + 'T' + (a.strTime || '00:00'));
    const db = new Date(b.dateEvent + 'T' + (b.strTime || '00:00'));
    return da - db;
  });

  const totalFinished = allFinished.length;
  const latestRound = sortedRounds[0] || '?';

  return (
    <div className="page-content">
      {/* League Header */}
      <div className="league-hero">
        <div className="league-hero__bg" />
        <div className="container league-hero__content">
          <Link to="/bong-da" className="league-hero__back">
            <FiArrowLeft /> Quay lại
          </Link>
          <div className="league-hero__info">
            {league?.strBadge && (
              <img src={league.strBadge} alt={leagueName} className="league-hero__badge" />
            )}
            <div>
              <h1 className="league-hero__title">{leagueName}</h1>
              <p className="league-hero__country">
                {leagueInfo?.flag} {league?.strCountry || leagueInfo?.country}
                {league?.strCurrentSeason && ` | Mùa giải ${league.strCurrentSeason}`}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="league-stats">
            <div className="league-stat">
              <span className="league-stat__value">{seasonEvents.length}</span>
              <span className="league-stat__label">Tổng trận</span>
            </div>
            <div className="league-stat">
              <span className="league-stat__value">{totalFinished}</span>
              <span className="league-stat__label">Đã đấu</span>
            </div>
            <div className="league-stat">
              <span className="league-stat__value">{allUpcoming.length}</span>
              <span className="league-stat__label">Sắp tới</span>
            </div>
            {latestRound !== '?' && (
              <div className="league-stat">
                <span className="league-stat__value">V{latestRound}</span>
                <span className="league-stat__label">Vòng mới nhất</span>
              </div>
            )}
          </div>

          {league?.strDescriptionEN && (
            <p className="league-hero__desc">
              {league.strDescriptionEN.substring(0, 250)}...
            </p>
          )}
        </div>
      </div>

      <div className="container">
        {/* Tabs */}
        <div className="league-tabs-bar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`league-tabs-bar__tab ${activeTab === tab.id ? 'league-tabs-bar__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon style={{ fontSize: '0.9rem' }} />
                {tab.label}
                {tab.id === 'results' && totalFinished > 0 && (
                  <span className="tab-count">{totalFinished}</span>
                )}
                {tab.id === 'upcoming' && allUpcoming.length > 0 && (
                  <span className="tab-count">{allUpcoming.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Upcoming */}
        {activeTab === 'upcoming' && (
          <div className="section">
            <h2 className="section-title">Trận Đấu Sắp Diễn Ra</h2>
            {allUpcoming.length > 0 ? (
              <div className="match-grid">
                {allUpcoming.map(event => (
                  <MatchCard key={event.idEvent} event={event} />
                ))}
              </div>
            ) : (
              <div className="football-empty">
                <FiCalendar style={{ fontSize: '1.5rem', marginBottom: 8 }} />
                <p>Chưa có lịch thi đấu sắp tới</p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {activeTab === 'results' && (
          <div className="section">
            <div className="results-header">
              <h2 className="section-title">Kết Quả Mùa Giải {CURRENT_SEASON}</h2>
              <span className="total-count">{totalFinished} trận</span>
            </div>
            {sortedRounds.length > 0 ? (
              sortedRounds.map(round => (
                <div key={round} className="results-round">
                  <div className="results-round__header">
                    <span>Vòng {round}</span>
                    <span className="results-round__count">{groupedByRound[round].length} trận</span>
                  </div>
                  <div className="match-grid">
                    {groupedByRound[round].map(event => (
                      <MatchCard key={event.idEvent} event={event} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="football-empty">
                <FiList style={{ fontSize: '1.5rem', marginBottom: 8 }} />
                <p>Chưa có kết quả mùa giải này</p>
              </div>
            )}
          </div>
        )}

        {/* Standings */}
        {activeTab === 'standings' && (
          <div className="section">
            <h2 className="section-title">Bảng Xếp Hạng {CURRENT_SEASON}</h2>
            {standings.length > 0 ? (
              <>
                <div className="standings-table-wrapper">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th className="standings-team-col">Đội</th>
                        <th>Tr</th>
                        <th>T</th>
                        <th>H</th>
                        <th>B</th>
                        <th>BT</th>
                        <th>BB</th>
                        <th>HS</th>
                        <th className="standings-pts">Đ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team, i) => (
                        <tr key={team.teamid || i} className={
                          i < 4 ? 'standings-ucl' :
                          i === 4 ? 'standings-uel' :
                          i >= standings.length - 3 ? 'standings-rel' : ''
                        }>
                          <td className="standings-rank">{team.intRank || i + 1}</td>
                          <td className="standings-team">
                            {team.strTeamBadge && (
                              <img src={team.strTeamBadge} alt="" className="standings-team__badge" />
                            )}
                            <span>{team.strTeam || team.name}</span>
                          </td>
                          <td>{team.intPlayed}</td>
                          <td>{team.intWin}</td>
                          <td>{team.intDraw}</td>
                          <td>{team.intLoss}</td>
                          <td>{team.intGoalsFor}</td>
                          <td>{team.intGoalsAgainst}</td>
                          <td>{team.intGoalDifference}</td>
                          <td className="standings-pts">{team.intPoints}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {standings.length <= 5 && (
                  <div className="standings-note">
                    * Hiển thị Top {standings.length} đội bóng
                  </div>
                )}
                <div className="standings-legend">
                  <div className="standings-legend__item">
                    <span className="standings-legend__color standings-legend__color--ucl" />
                    Champions League
                  </div>
                  {standings.length > 5 && (
                    <>
                      <div className="standings-legend__item">
                        <span className="standings-legend__color standings-legend__color--uel" />
                        Europa League
                      </div>
                      <div className="standings-legend__item">
                        <span className="standings-legend__color standings-legend__color--rel" />
                        Xuống hạng
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="football-empty">
                <FiAward style={{ fontSize: '1.5rem', marginBottom: 8 }} />
                <p>Chưa có bảng xếp hạng mùa giải này</p>
              </div>
            )}
          </div>
        )}

        {/* Other Leagues */}
        <div className="section">
          <h2 className="section-title">Giải Đấu Khác</h2>
          <div className="other-leagues">
            {LEAGUES.filter(l => l.id !== leagueId).map(l => (
              <Link key={l.id} to={`/bong-da/giai-dau/${l.id}`} className="other-league-link">
                <span>{l.flag}</span>
                <span>{l.name}</span>
                <FiChevronRight />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

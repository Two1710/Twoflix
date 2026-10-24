import { getMatchStatus, formatMatchTime, formatMatchDate } from '../services/footballApi';
import './MatchCard.css';

export default function MatchCard({ event, compact = false }) {
  if (!event) return null;

  const status = getMatchStatus(event);
  const time = formatMatchTime(event);
  const date = formatMatchDate(event);

  return (
    <div className={`match-card ${status === 'live' ? 'match-card--live' : ''} ${compact ? 'match-card--compact' : ''}`}>
      {/* Header: League + Round + Date */}
      <div className="match-card__header">
        <div className="match-card__league">
          {event.strLeagueBadge && (
            <img src={event.strLeagueBadge} alt="" className="match-card__league-badge" />
          )}
          <span>{event.strLeague}</span>
        </div>
        {event.intRound && (
          <span className="match-card__round">V{event.intRound}</span>
        )}
      </div>

      {/* Teams + Score */}
      <div className="match-card__body">
        <div className="match-card__team">
          <div className="match-card__team-logo">
            {event.strHomeTeamBadge ? (
              <img src={event.strHomeTeamBadge} alt={event.strHomeTeam} loading="lazy" />
            ) : (
              <div className="match-card__team-placeholder">{event.strHomeTeam?.charAt(0)}</div>
            )}
          </div>
          <span className="match-card__team-name">{event.strHomeTeam}</span>
        </div>

        <div className="match-card__center">
          {status === 'finished' || status === 'live' ? (
            <div className="match-card__score">
              <span>{event.intHomeScore ?? '-'}</span>
              <span className="match-card__score-sep">:</span>
              <span>{event.intAwayScore ?? '-'}</span>
            </div>
          ) : (
            <div className="match-card__time-block">
              <span className="match-card__time">{time}</span>
            </div>
          )}
          <div className={`match-status match-status--${status}`}>
            {status === 'live' && <span className="match-status__dot" />}
            {status === 'live' ? 'Trực tiếp' : status === 'finished' ? 'Kết thúc' : date}
          </div>
        </div>

        <div className="match-card__team">
          <div className="match-card__team-logo">
            {event.strAwayTeamBadge ? (
              <img src={event.strAwayTeamBadge} alt={event.strAwayTeam} loading="lazy" />
            ) : (
              <div className="match-card__team-placeholder">{event.strAwayTeam?.charAt(0)}</div>
            )}
          </div>
          <span className="match-card__team-name">{event.strAwayTeam}</span>
        </div>
      </div>

      {/* Footer: Venue + Video */}
      <div className="match-card__footer">
        {event.strVenue && (
          <span className="match-card__venue">{event.strVenue}</span>
        )}
        {event.strVideo && (
          <a href={event.strVideo} target="_blank" rel="noopener noreferrer" className="match-card__video-link">
            Highlights
          </a>
        )}
      </div>
    </div>
  );
}

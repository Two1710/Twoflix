const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/123';
const SCOREBAT_BASE = 'https://www.scorebat.com/video-api/v3';

// Auto-detect season: Aug-Dec = current/next, Jan-Jul = prev/current
function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

export const CURRENT_SEASON = getCurrentSeason();

export const LEAGUES = [
  { id: '4328', name: 'Ngoại Hạng Anh', nameEn: 'Premier League', country: 'Anh', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id: '4335', name: 'La Liga', nameEn: 'La Liga', country: 'Tây Ban Nha', flag: '🇪🇸' },
  { id: '4332', name: 'Serie A', nameEn: 'Serie A', country: 'Ý', flag: '🇮🇹' },
  { id: '4331', name: 'Bundesliga', nameEn: 'Bundesliga', country: 'Đức', flag: '🇩🇪' },
  { id: '4334', name: 'Ligue 1', nameEn: 'Ligue 1', country: 'Pháp', flag: '🇫🇷' },
  { id: '4480', name: 'Champions League', nameEn: 'Champions League', country: 'Châu Âu', flag: '🇪🇺' },
  { id: '4481', name: 'Europa League', nameEn: 'Europa League', country: 'Châu Âu', flag: '🇪🇺' },
];

// Map ScoreBat competition strings to display names
const COMPETITION_MAP = {
  'ENGLAND: Premier League': 'Premier League',
  'SPAIN: La Liga': 'La Liga',
  'ITALY: Serie A': 'Serie A',
  'GERMANY: Bundesliga': 'Bundesliga',
  'FRANCE: Ligue 1': 'Ligue 1',
  'EUROPE: Champions League': 'Champions League',
  'EUROPE: Europa League': 'Europa League',
  'EUROPE: Conference League': 'Conference League',
  'PORTUGAL: Liga Portugal': 'Liga Portugal',
  'ENGLAND: Championship': 'Championship',
};

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

// ====== TheSportsDB API ======

export async function fetchMatchesByDate(date) {
  const d = date ? formatDate(date) : formatDate(new Date());
  const res = await fetch(`${SPORTSDB_BASE}/eventsday.php?d=${d}&s=Soccer`);
  const data = await res.json();
  return data.events || [];
}

// Fetch matches for multiple days around a date (for richer data)
export async function fetchMatchesRange(centerDate, daysBefore = 1, daysAfter = 2) {
  const center = centerDate ? new Date(centerDate) : new Date();
  const dates = [];
  for (let i = -daysBefore; i <= daysAfter; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    dates.push(formatDate(d));
  }
  const results = await Promise.all(
    dates.map(d => fetch(`${SPORTSDB_BASE}/eventsday.php?d=${d}&s=Soccer`).then(r => r.json()).catch(() => ({})))
  );
  const allEvents = [];
  results.forEach((data, i) => {
    (data.events || []).forEach(e => {
      e._queryDate = dates[i];
      allEvents.push(e);
    });
  });
  return allEvents;
}

export async function fetchLeagueNextEvents(leagueId) {
  const res = await fetch(`${SPORTSDB_BASE}/eventsnextleague.php?id=${leagueId}`);
  const data = await res.json();
  return data.events || [];
}

export async function fetchLeaguePastEvents(leagueId) {
  const res = await fetch(`${SPORTSDB_BASE}/eventspastleague.php?id=${leagueId}`);
  const data = await res.json();
  return data.events || [];
}

export async function fetchLeagueDetails(leagueId) {
  const res = await fetch(`${SPORTSDB_BASE}/lookupleague.php?id=${leagueId}`);
  const data = await res.json();
  return data.leagues?.[0] || null;
}

export async function fetchTeamDetails(teamId) {
  const res = await fetch(`${SPORTSDB_BASE}/lookupteam.php?id=${teamId}`);
  const data = await res.json();
  return data.teams?.[0] || null;
}

export async function fetchLeagueTable(leagueId, season = CURRENT_SEASON) {
  const res = await fetch(`${SPORTSDB_BASE}/lookuptable.php?l=${leagueId}&s=${season}`);
  const data = await res.json();
  return data.table || [];
}

export async function fetchSeasonEvents(leagueId, season = CURRENT_SEASON) {
  const res = await fetch(`${SPORTSDB_BASE}/eventsseason.php?id=${leagueId}&s=${season}`);
  const data = await res.json();
  return data.events || [];
}

// ====== ScoreBat API ======

export async function fetchHighlights() {
  try {
    const res = await fetch(SCOREBAT_BASE);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.response || [];
    // Normalize competition field
    return arr.map(h => ({
      ...h,
      competitionName: normalizeCompetition(h.competition),
    }));
  } catch {
    return [];
  }
}

function normalizeCompetition(comp) {
  if (!comp) return '';
  // comp can be string like "ENGLAND: Premier League"
  if (typeof comp === 'string') {
    return COMPETITION_MAP[comp] || comp.split(': ').pop() || comp;
  }
  return comp.name || '';
}

// ====== Helpers ======

export function getMatchStatus(event) {
  if (!event) return 'upcoming';
  const now = new Date();
  const timeStr = event.strTime || event.strTimeLocal || '00:00:00';
  const matchDate = new Date(`${event.dateEvent}T${timeStr}`);
  const matchEnd = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);

  const hasScore = event.intHomeScore !== null && event.intAwayScore !== null;

  if (hasScore) {
    if (now >= matchDate && now <= matchEnd) return 'live';
    return 'finished';
  }
  if (now >= matchDate && now <= matchEnd) return 'live';
  return 'upcoming';
}

export function formatMatchTime(event) {
  if (!event) return '--:--';
  const time = event.strTimeLocal || event.strTime;
  if (!time) return '--:--';
  // Convert to VN timezone (UTC+7) display
  return time.substring(0, 5);
}

export function formatMatchDate(event) {
  if (!event?.dateEvent) return '';
  const d = new Date(event.dateEvent);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatFullDate(event) {
  if (!event?.dateEvent) return '';
  const d = new Date(event.dateEvent);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function groupEventsByDate(events) {
  const groups = {};
  events.forEach(e => {
    const date = e.dateEvent || 'unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(e);
  });
  return groups;
}

export function groupEventsByLeague(events) {
  const groups = {};
  events.forEach(e => {
    const league = e.strLeague || 'Khác';
    if (!groups[league]) groups[league] = [];
    groups[league].push(e);
  });
  return groups;
}

const TMDB_API_KEY = '051675f9cf39c424859f3e0aa5fcfd85';
const BASE_URL = 'https://api.themoviedb.org/3';

// Fast In-Memory Cache for rapid SPA navigation (mimics SSR speed on client)
const apiCache = new Map();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

async function fetchWithCache(url) {
  const now = Date.now();
  if (apiCache.has(url)) {
    const cached = apiCache.get(url);
    if (now - cached.timestamp < CACHE_TTL) {
      return JSON.parse(JSON.stringify(cached.data)); // return deep copy
    }
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  apiCache.set(url, { timestamp: now, data });
  return JSON.parse(JSON.stringify(data));
}

export function getImageUrl(path, size = 'w500') {
  if (!path) return 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
  if (path.startsWith('http')) return path;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function fetchNewMovies(page = 1) {
  const url = `${BASE_URL}/trending/movie/day?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`;
  const data = await fetchWithCache(url);
  data.items = data.results.map(tmdbToMovie);
  return data;
}

export async function fetchMoviesByType(type, page = 1) {
  let endpoint = '/trending/movie/week';
  let extraParams = '';
  
  if (type === 'phim-moi-cap-nhat') endpoint = '/movie/now_playing';
  else if (type === 'phim-bo') endpoint = '/tv/popular';
  else if (type === 'phim-le') endpoint = '/movie/popular';
  else if (type === 'hoat-hinh') { endpoint = '/discover/movie'; extraParams = '&with_genres=16'; }
  else if (type === 'tv-shows') endpoint = '/tv/top_rated';

  const url = `${BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}${extraParams}`;
  const data = await fetchWithCache(url);
  data.items = data.results.map(m => tmdbToMovie(m, type === 'phim-bo' || type === 'tv-shows' ? 'tv' : 'movie'));
  data.pagination = { totalPages: Math.min(data.total_pages, 500), totalItems: data.total_results };
  return data;
}

export async function fetchMovieDetail(slug) {
  // slug format: "movie_12345" or "tv_12345" (underscore separator, URL-safe)
  const cleanSlug = slug.trim();
  let mediaType, id;
  
  if (cleanSlug.startsWith('tv_') || cleanSlug.startsWith('tv-') || cleanSlug.startsWith('tv ')) {
    mediaType = 'tv';
    id = cleanSlug.slice(3).trim();
  } else if (cleanSlug.startsWith('movie_') || cleanSlug.startsWith('movie-') || cleanSlug.startsWith('movie ')) {
    mediaType = 'movie';
    id = cleanSlug.slice(6).trim();
  } else {
    mediaType = 'movie';
    id = cleanSlug;
  }
  
  const url = `${BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits&language=vi-VN`;
  try {
    const data = await fetchWithCache(url);
    return { status: true, movie: tmdbToDetail(data, mediaType) };
  } catch(err) {
    return { status: false, movie: null };
  }
}

export async function searchMovies(keyword, page = 1) {
  const url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(keyword)}&language=vi-VN&page=${page}`;
  const data = await fetchWithCache(url);
  data.items = data.results.filter(m => m.media_type !== 'person').map(m => tmdbToMovie(m, m.media_type));
  data.pagination = { totalPages: data.total_pages, totalItems: data.total_results };
  return data;
}

export async function fetchGenres() {
  const url = `${BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=vi-VN`;
  const data = await fetchWithCache(url);
  const items = data.genres.map(g => ({ _id: g.id, name: g.name, slug: g.id.toString() }));
  return { data: { items } };
}

export async function fetchCountries() {
  // TMDB doesn't have a direct "country lists with movies" easy endpoint, we mock some top ones
  const items = [
    { _id: 'US', name: 'Âu Mỹ', slug: 'US' },
    { _id: 'KR', name: 'Hàn Quốc', slug: 'KR' },
    { _id: 'JP', name: 'Nhật Bản', slug: 'JP' },
    { _id: 'CN', name: 'Trung Quốc', slug: 'CN' },
    { _id: 'VN', name: 'Việt Nam', slug: 'VN' },
    { _id: 'TH', name: 'Thái Lan', slug: 'TH' }
  ];
  return { data: { items } };
}

export async function fetchByCategory(type, slug, page = 1, filters = {}) {
  // type is 'the-loai' or 'quoc-gia'
  const isCountry = type === 'quoc-gia';
  let url = `${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}`;
  
  if (isCountry) {
    url += `&with_origin_country=${slug}`;
  } else {
    url += `&with_genres=${slug}`;
  }

  if (filters.year) url += `&primary_release_year=${filters.year}`;
  if (filters.sort && filters.sort !== '_id') {
    const sortMap = { 'modified.time': 'primary_release_date.desc', 'year': 'primary_release_date.desc' };
    url += `&sort_by=${sortMap[filters.sort] || 'popularity.desc'}`;
  }

  const data = await fetchWithCache(url);
  data.items = data.results.map(tmdbToMovie);
  data.pagination = { totalPages: Math.min(data.total_pages, 500), totalItems: data.total_results };
  return data;
}

export async function fetchMoviesByTypeWithFilters(type, page = 1, filters = {}) {
  let endpoint = '/discover/movie';
  let extra = '';
  if (type === 'phim-bo' || type === 'tv-shows') endpoint = '/discover/tv';
  if (type === 'hoat-hinh') extra = '&with_genres=16';

  let url = `${BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}&language=vi-VN&page=${page}${extra}`;
  if (filters.country) url += `&with_origin_country=${filters.country}`;
  if (filters.year) {
    if (endpoint === '/discover/tv') url += `&first_air_date_year=${filters.year}`;
    else url += `&primary_release_year=${filters.year}`;
  }
  
  const data = await fetchWithCache(url);
  data.items = data.results.map(m => tmdbToMovie(m, endpoint === '/discover/tv' ? 'tv' : 'movie'));
  data.pagination = { totalPages: Math.min(data.total_pages, 500), totalItems: data.total_results };
  return data;
}

// --- Mappers to bridge the gap between TMDB models and our UI models ---

function tmdbToMovie(m, mediaType = 'movie') {
  const isTv = mediaType === 'tv' || m.media_type === 'tv';
  return {
    _id: m.id,
    name: isTv ? (m.name || m.original_name) : (m.title || m.original_title),
    origin_name: isTv ? m.original_name : m.original_title,
    slug: `${isTv ? 'tv' : 'movie'}_${m.id}`,
    poster_url: m.poster_path,
    thumb_url: m.backdrop_path || m.poster_path,
    year: parseInt((isTv ? m.first_air_date : m.release_date)?.split('-')[0]) || '',
    quality: isTv ? 'HD' : 'FHD',
    episode_current: isTv ? 'Tập mới' : 'Full',
    lang: 'Vietsub',
    vote_average: m.vote_average,
    overview: m.overview
  };
}

function tmdbToDetail(m, mediaType = 'movie') {
  const isTv = mediaType === 'tv';
  const episodes = [];
  
  if (isTv && m.seasons) {
    const activeSeasons = m.seasons.filter(s => s.season_number > 0);
    activeSeasons.forEach(season => {
      const serverData = [];
      for (let i = 1; i <= season.episode_count; i++) {
        serverData.push({
          name: i.toString(),
          slug: i.toString(),
          filename: `S${season.season_number}E${i}`,
          link_embed: `https://vidsrc.to/embed/tv/${m.id}/${season.season_number}/${i}`,
          season: season.season_number,
          episode: i
        });
      }
      if (serverData.length > 0) {
        episodes.push({
          server_name: `Season ${season.season_number}`,
          server_data: serverData
        });
      }
    });
  } else {
    episodes.push({
      server_name: 'Vidsrc',
      server_data: [{
        name: 'Full', slug: 'full', filename: 'Movie', link_embed: `https://vidsrc.to/embed/movie/${m.id}`, episode: 0
      }]
    });
  }

  return {
    id: m.id,
    name: isTv ? m.name : m.title,
    origin_name: isTv ? m.original_name : m.original_title,
    slug: `${isTv ? 'tv' : 'movie'}_${m.id}`,
    content: m.overview,
    type: isTv ? 'series' : 'single',
    status: m.status,
    poster_url: m.poster_path,
    thumb_url: m.backdrop_path || m.poster_path,
    time: isTv ? `${m.episode_run_time?.[0] || 45} phút` : `${m.runtime} phút`,
    episode_current: isTv ? `${m.number_of_episodes} Tập` : 'Full',
    episode_total: isTv ? m.number_of_episodes : 1,
    quality: 'FHD',
    lang: 'Vietsub',
    year: parseInt((isTv ? m.first_air_date : m.release_date)?.split('-')[0]) || '',
    actor: m.credits?.cast?.slice(0, 10).map(c => c.name) || [],
    director: m.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name) || [],
    category: m.genres?.map(g => ({ id: g.id, name: g.name })) || [],
    episodes: episodes,
    tmdb_data: m // injected for raw access
  };
}

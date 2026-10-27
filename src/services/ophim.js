import { parseJsonResponse } from '../utils/parseJsonResponse';

/**
 * KKPhim (phimapi.com) API Service
 * Provides real HLS video streams and movie data
 * Combined with TMDB for enriched metadata
 */

const OPHIM_BASE = 'https://phimapi.com';
const OPHIM_IMG = 'https://phimimg.com/';

// Simple in-memory cache (15 min TTL)
const ophimCache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

async function ophimFetch(url) {
  const now = Date.now();
  if (ophimCache.has(url)) {
    const { data, ts } = ophimCache.get(url);
    if (now - ts < CACHE_TTL) return JSON.parse(JSON.stringify(data));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`PhimAPI HTTP ${res.status}`);
  const data = await parseJsonResponse(res, 'Nguồn dữ liệu phim');
  ophimCache.set(url, { data, ts: now });
  return JSON.parse(JSON.stringify(data));
}

export function getOphimImageUrl(filename) {
  if (!filename) return 'https://placehold.co/300x450/0f0f1a/ffffff?text=No+Image';
  if (filename.startsWith('http')) return filename;
  return `${OPHIM_IMG}${filename}`;
}

/**
 * Fetch movie list by type - returns normalized items array
 */
export async function fetchOphimList(type = 'phim-moi-cap-nhat', page = 1) {
  let url;
  if (type === 'phim-moi-cap-nhat') {
    // Root level endpoint: returns { status, items, pathImage, pagination }
    url = `${OPHIM_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`;
    const data = await ophimFetch(url);
    const items = data.items || [];
    const pagination = data.pagination || {};
    return {
      items: items.map(m => normalizeItem(m, data.pathImage)),
      totalPages: Math.ceil((pagination.totalItems || items.length) / (pagination.totalItemsPerPage || 24)),
      totalItems: pagination.totalItems || items.length,
      currentPage: pagination.currentPage || page,
    };
  } else if (type === 'tv-shows') {
    // Map to Ophim hoat-hinh or phim-bo
    url = `${OPHIM_BASE}/v1/api/danh-sach/phim-bo?page=${page}`;
  } else {
    url = `${OPHIM_BASE}/v1/api/danh-sach/${type}?page=${page}`;
  }

  // v1/api endpoint: returns { status, message, data: { items, params: { pagination } } }
  const res = await ophimFetch(url);
  const raw = res.data || res;
  const items = raw.items || [];
  const pagination = raw.params?.pagination || raw.pagination || {};

  return {
    items: items.map(m => normalizeItem(m)),
    totalPages: Math.ceil((pagination.totalItems || items.length) / (pagination.totalItemsPerPage || 24)),
    totalItems: pagination.totalItems || items.length,
    currentPage: pagination.currentPage || page,
  };
}

/**
 * Fetch full movie detail including episodes with HLS links
 * Ophim root endpoint: /phim/{slug} returns { status, msg, movie, episodes }
 */
export async function fetchOphimDetail(slug) {
  const url = `${OPHIM_BASE}/phim/${slug}`;
  const data = await ophimFetch(url);

  const movie = data.movie;
  if (!movie) return null;

  // Episodes are at root level: data.episodes (array of servers with server_data)
  const episodes = data.episodes || [];

  return {
    movie: normalizeDetailItem(movie),
    episodes,
  };
}

/**
 * Search movies
 */
export async function searchOphim(keyword, page = 1) {
  const url = `${OPHIM_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`;
  const data = await ophimFetch(url);
  const raw = data.data || data;
  const items = raw.items || [];
  const pagination = raw.params?.pagination || {};

  return {
    items: items.map(m => normalizeItem(m)),
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.totalItems || items.length,
  };
}

/**
 * Fetch genres list
 */
export async function fetchOphimGenres() {
  const url = `${OPHIM_BASE}/the-loai`;
  const data = await ophimFetch(url);
  const items = Array.isArray(data) ? data : (data.data?.items || []);
  return items.map(g => ({ _id: g._id, name: g.name, slug: g.slug }));
}

/**
 * Fetch countries list
 */
export async function fetchOphimCountries() {
  const url = `${OPHIM_BASE}/quoc-gia`;
  const data = await ophimFetch(url);
  const items = Array.isArray(data) ? data : (data.data?.items || []);
  return items.map(c => ({ _id: c._id, name: c.name, slug: c.slug }));
}

/**
 * Fetch by category (the-loai or quoc-gia)
 */
export async function fetchOphimByCategory(type, slug, page = 1, filters = {}) {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.year) params.set('year', filters.year);
  if (filters.sort && filters.sort !== '_id') params.set('sort_field', filters.sort);

  const url = `${OPHIM_BASE}/v1/api/${type}/${slug}?${params.toString()}`;
  const data = await ophimFetch(url);
  const raw = data.data || data;
  const items = raw.items || [];
  const pagination = raw.params?.pagination || {};

  return {
    items: items.map(m => normalizeItem(m)),
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.totalItems || items.length,
    title: raw.titlePage || slug,
  };
}

// --- Normalization helpers ---

function normalizeItem(m, pathImage = OPHIM_IMG) {
  const resolveImg = (url) => {
    if (!url) return 'https://placehold.co/300x450/0f0f1a/ffffff?text=No+Image';
    if (url.startsWith('http')) return url;
    return `${pathImage}${url}`;
  };
  return {
    _id: m._id,
    name: m.name,
    origin_name: m.origin_name,
    slug: m.slug,
    poster_url: resolveImg(m.poster_url),
    thumb_url: resolveImg(m.thumb_url),
    year: m.year,
    quality: m.quality || 'HD',
    episode_current: m.episode_current || 'Full',
    lang: m.lang || 'Vietsub',
    tmdb_id: m.tmdb?.id || null,
    tmdb_type: m.tmdb?.type || 'movie',
    type: m.type || 'single',
  };
}

function normalizeDetailItem(m) {
  return {
    _id: m._id,
    name: m.name,
    origin_name: m.origin_name,
    slug: m.slug,
    content: m.content?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') || '',
    type: m.type || 'single',
    status: m.status,
    poster_url: getOphimImageUrl(m.poster_url),
    thumb_url: getOphimImageUrl(m.thumb_url),
    time: m.time || '',
    episode_current: m.episode_current || 'Full',
    episode_total: m.episode_total || 1,
    quality: m.quality || 'FHD',
    lang: m.lang || 'Vietsub',
    year: m.year,
    actor: Array.isArray(m.actor) ? m.actor : [],
    director: Array.isArray(m.director) ? m.director : [],
    category: Array.isArray(m.category) ? m.category : [],
    country: Array.isArray(m.country) ? m.country : [],
    tmdb_id: m.tmdb?.id || null,
    tmdb_type: m.tmdb?.type || 'movie',
  };
}

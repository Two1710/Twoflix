import { validSession } from './admin-auth-handler.js';

const HOT_MOVIES_KEY = 'twoflix:hot-movies';
const MAX_HOT_MOVIES = 12;

async function redisCommand(command) {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Chưa cấu hình KV_REST_API_URL và KV_REST_API_TOKEN.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('Không thể kết nối kho lưu phim hot.');
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.result;
}

async function readBody(req) {
  if (req.body) return req.body;
  if (!req[Symbol.asyncIterator]) return {};
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try { return JSON.parse(raw); } catch { return {}; }
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function cleanMovies(value) {
  if (!Array.isArray(value) || value.length > MAX_HOT_MOVIES) return null;
  const movies = [];
  const seen = new Set();
  for (const item of value) {
    const slug = String(item?.slug || '').trim();
    const name = String(item?.name || '').trim().slice(0, 180);
    if (!/^[a-z0-9-]{1,140}$/i.test(slug) || !name || seen.has(slug)) return null;
    seen.add(slug);
    movies.push({
      _id: String(item._id || slug).slice(0, 160),
      slug,
      name,
      origin_name: String(item.origin_name || '').slice(0, 180),
      poster_url: safeHttpsUrl(item.poster_url),
      thumb_url: safeHttpsUrl(item.thumb_url),
      year: item.year ? String(item.year).slice(0, 4) : '',
      quality: String(item.quality || 'HD').slice(0, 20),
      episode_current: String(item.episode_current || 'Full').slice(0, 40),
      lang: String(item.lang || 'Vietsub').slice(0, 40),
    });
  }
  return movies;
}

export default async function hotMoviesHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'GET') {
    try {
      const stored = await redisCommand(['GET', HOT_MOVIES_KEY]);
      res.statusCode = 200;
      res.end(JSON.stringify({ movies: stored ? JSON.parse(stored) : [] }));
    } catch (error) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Phương thức không được hỗ trợ.' }));
    return;
  }
  if (!validSession(req)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Vui lòng đăng nhập quản trị.' }));
    return;
  }

  const body = await readBody(req);
  const movies = cleanMovies(body.movies);
  if (!movies) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: `Danh sách phải có tối đa ${MAX_HOT_MOVIES} phim và không có phim trùng.` }));
    return;
  }
  try {
    await redisCommand(['SET', HOT_MOVIES_KEY, JSON.stringify(movies)]);
    res.statusCode = 200;
    res.end(JSON.stringify({ movies }));
  } catch (error) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: error.message }));
  }
}

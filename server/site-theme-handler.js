import { validSession } from './admin-auth-handler.js';

const THEME_KEY = 'twoflix:site-theme';
const ALLOWED_THEMES = new Set(['default', 'tet', 'valentine', 'mid-autumn', 'halloween', 'christmas', 'new-year']);

async function redisCommand(command) {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Chưa cấu hình KV_REST_API_URL và KV_REST_API_TOKEN.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('Không thể kết nối kho lưu chủ đề.');
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.result;
}

export default async function siteThemeHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'GET') {
    try {
      const theme = await redisCommand(['GET', THEME_KEY]);
      res.statusCode = 200;
      res.end(JSON.stringify({ theme: ALLOWED_THEMES.has(theme) ? theme : 'default' }));
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

  let body = req.body;
  if (!body && req[Symbol.asyncIterator]) {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { body = JSON.parse(raw); } catch { body = {}; }
  }
  const theme = String(body?.theme || '');
  if (!ALLOWED_THEMES.has(theme)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Chủ đề không hợp lệ.' }));
    return;
  }

  try {
    await redisCommand(['SET', THEME_KEY, theme]);
    res.statusCode = 200;
    res.end(JSON.stringify({ theme }));
  } catch (error) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: error.message }));
  }
}

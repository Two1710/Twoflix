import { validSession } from './admin-auth-handler.js';

const ANNOUNCEMENT_KEY = 'twoflix:announcement';

function redisConfig() {
  return {
    url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, ''),
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

async function redisCommand(command) {
  const { url, token } = redisConfig();
  if (!url || !token) throw new Error('Chưa cấu hình KV_REST_API_URL và KV_REST_API_TOKEN.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('Không thể kết nối kho lưu thông báo.');
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

export default async function announcementHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'GET') {
    try {
      const stored = await redisCommand(['GET', ANNOUNCEMENT_KEY]);
      res.statusCode = 200;
      res.end(JSON.stringify({ announcement: stored ? JSON.parse(stored) : null }));
    } catch (error) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  if (!validSession(req)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Vui lòng đăng nhập quản trị.' }));
    return;
  }
  if (req.method === 'DELETE') {
    try {
      await redisCommand(['DEL', ANNOUNCEMENT_KEY]);
      res.statusCode = 200;
      res.end(JSON.stringify({ announcement: null }));
    } catch (error) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Phương thức không được hỗ trợ.' }));
    return;
  }

  const body = await readBody(req);
  const message = String(body.message ?? '').trim().slice(0, 500);
  if (!message) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Hãy nhập nội dung thông báo.' }));
    return;
  }
  const announcement = { message, updatedAt: new Date().toISOString() };
  try {
    await redisCommand(['SET', ANNOUNCEMENT_KEY, JSON.stringify(announcement)]);
    res.statusCode = 200;
    res.end(JSON.stringify({ announcement }));
  } catch (error) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: error.message }));
  }
}

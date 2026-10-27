import { randomBytes } from 'node:crypto';
import { validSession } from './admin-auth-handler.js';

const ROOM_TTL_SECONDS = 6 * 60 * 60;
const CODE_PATTERN = /^[A-Z0-9_-]{8}$/;

async function redisCommand(command) {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Chưa cấu hình kho Redis cho phòng xem chung.');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!response.ok) throw new Error('Không thể kết nối kho dữ liệu phòng xem.');
  const result = await response.json();
  if (result.error) throw new Error(result.error);
  return result.result;
}

async function readBody(req) {
  if (req.body) return req.body;
  if (!req[Symbol.asyncIterator]) return {};
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 12_000) throw new Error('Dữ liệu gửi lên quá lớn.');
  }
  try { return JSON.parse(raw); } catch { return {}; }
}

function send(res, status, payload) {
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

function roomKey(code) {
  return `twoflix:watch-room:${code}`;
}

function queryCode(req) {
  const queryValue = req.query?.code;
  if (queryValue) return String(queryValue);
  try { return new URL(req.url || '/', 'http://localhost').searchParams.get('code') || ''; }
  catch { return ''; }
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export default async function watchRoomHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    if (req.method === 'GET') {
      const code = queryCode(req).trim().toUpperCase();
      if (!CODE_PATTERN.test(code)) return send(res, 400, { error: 'Mã phòng không hợp lệ.' });
      const stored = await redisCommand(['GET', roomKey(code)]);
      if (!stored) return send(res, 404, { error: 'Phòng đã kết thúc hoặc không tồn tại.' });
      return send(res, 200, { room: JSON.parse(stored) });
    }

    if (req.method === 'DELETE') {
      if (!validSession(req)) return send(res, 401, { error: 'Chỉ quản trị viên mới có thể kết thúc phòng.' });
      const code = queryCode(req).trim().toUpperCase();
      if (!CODE_PATTERN.test(code)) return send(res, 400, { error: 'Mã phòng không hợp lệ.' });
      const result = await redisCommand(['DEL', roomKey(code)]);
      return send(res, result ? 200 : 404, { closed: Boolean(result) });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST, DELETE');
      return send(res, 405, { error: 'Phương thức không được hỗ trợ.' });
    }

    const body = await readBody(req);
    if (body.action === 'create') {
      if (!validSession(req)) return send(res, 401, { error: 'Chỉ quản trị viên mới có thể tạo phòng.' });
      const movieSlug = String(body.movieSlug || '').trim();
      const title = String(body.title || '').trim().slice(0, 180);
      const episode = String(body.episode || '').trim().slice(0, 100);
      const sourceUrl = safeHttpsUrl(body.sourceUrl);
      const fallbackUrl = safeHttpsUrl(body.fallbackUrl);
      const poster = safeHttpsUrl(body.poster);
      if (!/^[a-z0-9-]{1,140}$/i.test(movieSlug) || !title || !sourceUrl) {
        return send(res, 400, { error: 'Thiếu phim, tập hoặc đường dẫn HLS hợp lệ để tạo phòng.' });
      }
      const code = randomBytes(6).toString('base64url').slice(0, 8).toUpperCase();
      const room = {
        code,
        movieSlug,
        title,
        episode,
        sourceUrl,
        fallbackUrl,
        poster,
        playing: false,
        currentTime: 0,
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      await redisCommand(['SET', roomKey(code), JSON.stringify(room), 'EX', String(ROOM_TTL_SECONDS)]);
      return send(res, 201, { room });
    }

    const code = String(body.code || '').trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) return send(res, 400, { error: 'Mã phòng không hợp lệ.' });
    const key = roomKey(code);
    const stored = await redisCommand(['GET', key]);
    if (!stored) return send(res, 404, { error: 'Phòng đã kết thúc hoặc không tồn tại.' });
    const room = JSON.parse(stored);
    const currentTime = Number(body.currentTime);
    if (!Number.isFinite(currentTime) || currentTime < 0) return send(res, 400, { error: 'Vị trí phát không hợp lệ.' });
    room.playing = body.playing === true;
    room.currentTime = currentTime;
    room.updatedAt = Date.now();
    await redisCommand(['SET', key, JSON.stringify(room), 'EX', String(ROOM_TTL_SECONDS)]);
    return send(res, 200, { room });
  } catch (error) {
    return send(res, 503, { error: error.message || 'Không thể xử lý phòng xem chung.' });
  }
}

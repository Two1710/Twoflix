import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'twoflix_admin';
const SESSION_SECONDS = 60 * 60 * 8;

function signature(value, secret) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function setCookie(res, value, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`);
}

export function validSession(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return false;
  const cookie = req.headers.cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  const [payload, supplied] = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1)).split('.');
  if (!payload || !supplied) return false;
  const expected = signature(payload, secret);
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expiresAt = Number(Buffer.from(payload, 'base64url').toString());
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export default async function adminAuthHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const method = req.method;
  if (method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ authenticated: validSession(req) }));
    return;
  }
  if (method === 'DELETE') {
    setCookie(res, '', 0);
    res.statusCode = 200;
    res.end(JSON.stringify({ authenticated: false }));
    return;
  }
  if (method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Phương thức không được hỗ trợ.' }));
    return;
  }

  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env;
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SESSION_SECRET) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'Chưa cấu hình thông tin quản trị trên máy chủ.' }));
    return;
  }

  let body = req.body;
  if (!body && req[Symbol.asyncIterator]) {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try { body = JSON.parse(raw); } catch { body = {}; }
  }
  const username = String(body?.username ?? '');
  const password = String(body?.password ?? '');
  const matches = (provided, expected) => {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  };
  if (!matches(username, ADMIN_USERNAME) || !matches(password, ADMIN_PASSWORD)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Tên đăng nhập hoặc mật khẩu chưa đúng.' }));
    return;
  }

  const payload = Buffer.from(String(Date.now() + SESSION_SECONDS * 1000)).toString('base64url');
  setCookie(res, `${payload}.${signature(payload, ADMIN_SESSION_SECRET)}`, SESSION_SECONDS);
  res.statusCode = 200;
  res.end(JSON.stringify({ authenticated: true }));
}

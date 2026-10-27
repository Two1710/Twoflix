export async function parseJsonResponse(response, label = 'Máy chủ') {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`${label} không gửi dữ liệu (HTTP ${response.status}).`);
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${label} gửi dữ liệu không hợp lệ (HTTP ${response.status}).`);
  }
}

export async function lockLandscape() {
  const orientation = window.screen?.orientation;
  try {
    if (orientation?.lock) await orientation.lock('landscape');
    else window.screen?.lockOrientation?.('landscape');
  } catch {
    // Some browsers only allow an orientation lock in fullscreen mode.
  }
}

export function unlockOrientation() {
  try {
    if (window.screen?.orientation?.unlock) window.screen.orientation.unlock();
    else window.screen?.unlockOrientation?.();
  } catch {
    // Orientation unlock is not supported in every browser.
  }
}

export function syncFullscreenOrientation(isFullscreen) {
  if (isFullscreen) lockLandscape();
  else unlockOrientation();
}

export async function enterFullscreen(element) {
  const request = element?.requestFullscreen
    || element?.webkitRequestFullscreen
    || element?.msRequestFullscreen;
  if (!request) return;
  try {
    await request.call(element);
    await lockLandscape();
  } catch {
    // Keep the player usable when fullscreen or orientation lock is unavailable.
  }
}

export async function exitFullscreen() {
  const exit = document.exitFullscreen
    || document.webkitExitFullscreen
    || document.msExitFullscreen;
  if (exit) {
    try { await exit.call(document); } catch { /* Browser may already have exited fullscreen. */ }
  }
  unlockOrientation();
}

let landscapeLockPromise = null;
let landscapeLocked = false;
let orientationRequestId = 0;

export async function lockLandscape() {
  if (landscapeLocked) return true;
  if (landscapeLockPromise) return landscapeLockPromise;

  const orientation = window.screen?.orientation;
  const requestId = ++orientationRequestId;
  const pending = Promise.resolve().then(async () => {
    try {
      if (orientation?.lock) {
        await orientation.lock('landscape');
        if (requestId === orientationRequestId) landscapeLocked = true;
        return requestId === orientationRequestId;
      }
      const legacyLock = window.screen?.lockOrientation;
      if (legacyLock) {
        const locked = legacyLock.call(window.screen, 'landscape') !== false;
        if (requestId === orientationRequestId) landscapeLocked = locked;
        return locked;
      }
    } catch {
      // The fullscreen change handler retries after the browser enters fullscreen.
    } finally {
      if (landscapeLockPromise === pending) landscapeLockPromise = null;
    }
    return false;
  });
  landscapeLockPromise = pending;

  return landscapeLockPromise;
}

export function unlockOrientation() {
  landscapeLocked = false;
  orientationRequestId += 1;
  landscapeLockPromise = null;
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

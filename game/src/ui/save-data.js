// The best night's take, remembered in this browser only. Storage can be missing or blocked
// (private windows, previews), so every access is guarded and the game runs fine without it.

const KEY = 'hushline.bestNight';

export function loadBestNight() {
  try {
    return Number(window.localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveBestNight(value) {
  try {
    window.localStorage.setItem(KEY, String(value));
  } catch {
    // no storage: the best night is simply not kept
  }
}

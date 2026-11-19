const STORAGE_KEY = 'bvm_papers_user';
const VALID_FOR_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_NAME_LENGTH = 24;

let memoryProfile = null;

function clearStoredProfile() {
  memoryProfile = null;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage can be disabled. */ }
}

export function getProfile() {
  let raw;
  try { raw = localStorage.getItem(STORAGE_KEY); }
  catch { return memoryProfile; }

  if (!raw) return memoryProfile;

  try {
    const saved = JSON.parse(raw);
    const displayName = typeof saved.displayName === 'string' ? saved.displayName.trim().slice(0, MAX_NAME_LENGTH) : '';
    if (!displayName || !Number.isFinite(saved.expiresAt) || saved.expiresAt <= Date.now()) {
      clearStoredProfile();
      return null;
    }
    return { displayName, expiresAt: saved.expiresAt };
  } catch {
    clearStoredProfile();
    return null;
  }
}

export function saveDisplayName(value) {
  const displayName = String(value ?? '').trim().slice(0, MAX_NAME_LENGTH);
  if (!displayName) return { ok: false, message: 'Enter a name, or continue as Anonymous.' };

  const profile = { displayName, expiresAt: Date.now() + VALID_FOR_MS };
  memoryProfile = profile;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch { /* Keep this visit usable without storage. */ }
  window.dispatchEvent(new CustomEvent('bvm-profile-change', { detail: profile }));
  return { ok: true, profile };
}

export function saveAnonymous() {
  return saveDisplayName('Anonymous');
}

export function getDisplayName() {
  return getProfile()?.displayName ?? '';
}

export function getSessionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

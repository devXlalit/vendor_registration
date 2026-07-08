// ============================================================
// Auth/session state for the Hato API.
//
// - deviceId: a stable per-browser id required by /auth/challenge + /verify-otp
// - after verify-otp we get { accessToken, refreshToken }; the userId is the
//   `sub` claim inside the accessToken JWT and is needed for all /users/:userId
//   calls, so we decode and cache it.
// ============================================================

const DEVICE_KEY = 'hato_device_id';
const AUTH_KEY = 'hato_auth';

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `web-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

interface AuthState {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

let auth: AuthState | null = load();

function load(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

/** Decode the `sub` (userId) claim from a JWT without verifying the signature. */
function decodeSub(token: string): string {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json.sub as string;
  } catch {
    return '';
  }
}

export function setAuth(tokens: { accessToken: string; refreshToken: string }) {
  auth = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    userId: decodeSub(tokens.accessToken),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearAuth() {
  auth = null;
  localStorage.removeItem(AUTH_KEY);
}

export const getAccessToken = () => auth?.accessToken ?? null;
export const getUserId = () => auth?.userId ?? null;

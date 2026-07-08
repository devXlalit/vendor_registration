// ============================================================
// API client for the Hato NestJS backend.
//
// Base URL = VITE_API_BASE_URL (e.g. http://localhost:3000). All routes are
// under /api/v1 and every response is wrapped as { statusCode, message, data }.
// The backend runs a strict ValidationPipe (whitelist + forbidNonWhitelisted),
// so request bodies must contain EXACTLY the fields each DTO declares.
//
// Registration maps onto several endpoints, keyed by the userId returned
// (as the JWT `sub`) from verify-otp:
//   POST /auth/challenge                 -> { challengeId }
//   POST /auth/verify-otp                -> { accessToken, refreshToken }
//   POST /auth/resend/:challengeId       -> { message, expiresIn }
//   POST /users/register/:userId         registerUserDto
//   POST /users/vendor-service/:userId   { service_ids: uuid[] }
//   PUT  /users/me/:userId/location      { latitude, longitude }
//   PUT  /users/vendor-availability/:userId  { availability: [...] }
//   PUT  /users/vendor-documents/:userId     { documents: [...] }
//
// Files are uploaded straight to Azure Blob (see azureUpload.ts); only their
// public URLs are sent to the API.
//
// When VITE_API_BASE_URL is unset the client runs in MOCK mode (OTP = 123456).
// ============================================================

import type { RegistrationData, UploadedFile } from '../types';
import { AZURE_DIRECT_UPLOAD, uploadToAzure } from './azureUpload';
import { getAccessToken, getDeviceId, getUserId, setAuth } from './session';
import { categoryById } from '../data/catalog';

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '');
const PREFIX = '/api/v1';
export const MOCK_MODE = !BASE;

const PLATFORM = 'web';
const ROLE = 'VENDOR';

// Document_Types UUIDs (no list endpoint exists) — supply via env to enable
// document submission, e.g. VITE_HATO_DOCTYPE_PAN=<uuid>.
const DOC_TYPE_IDS: Record<'pan' | 'gst' | 'fssai', string | undefined> = {
  pan: import.meta.env.VITE_HATO_DOCTYPE_PAN,
  gst: import.meta.env.VITE_HATO_DOCTYPE_GST,
  fssai: import.meta.env.VITE_HATO_DOCTYPE_FSSAI,
};

// Maps our category ids to the backend Service names (resolved to UUIDs at runtime).
const CATEGORY_TO_SERVICE: Record<string, string> = {
  restaurant: 'Food',
  grocery: 'Grocery',
  fruits_vegetables: 'Fruits & Vegetables',
};

interface Envelope<T> { statusCode: number; message: string; data: T }

async function api<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const res = await fetch(`${BASE}${PREFIX}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.auth && getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const m = json.message;
    throw new Error(Array.isArray(m) ? m.join(', ') : m || `Request failed (${res.status})`);
  }
  return (json as Envelope<T>).data;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- OTP
export interface SendOtpResult { requestId: string; expiresInSec: number }

export async function sendOtp(countryCode: string, phone: string): Promise<SendOtpResult> {
  if (MOCK_MODE) {
    await wait(700);
    return { requestId: `mock-${phone}`, expiresInSec: 120 };
  }
  const data = await api<{ challengeId: string }>('/auth/challenge', {
    method: 'POST',
    body: { phone: `${countryCode}${phone}`, deviceId: getDeviceId(), platform: PLATFORM, role: ROLE },
  });
  return { requestId: data.challengeId, expiresInSec: 120 };
}

export async function resendOtp(challengeId: string): Promise<SendOtpResult> {
  if (MOCK_MODE) {
    await wait(500);
    return { requestId: challengeId, expiresInSec: 120 };
  }
  const data = await api<{ message: string; expiresIn: number }>(`/auth/resend/${encodeURIComponent(challengeId)}`, {
    method: 'POST',
  });
  return { requestId: challengeId, expiresInSec: data.expiresIn ?? 120 };
}

export async function verifyOtp(requestId: string, code: string): Promise<boolean> {
  if (MOCK_MODE) {
    await wait(600);
    if (code !== '123456') throw new Error('Invalid code. In demo mode the code is 123456.');
    return true;
  }
  const data = await api<{ accessToken: string; refreshToken: string }>('/auth/verify-otp', {
    method: 'POST',
    body: { challengeId: requestId, otp: code, deviceId: getDeviceId() },
  });
  if (!data?.accessToken) return false;
  setAuth(data);
  return true;
}

// ---------------------------------------------------------------- Services lookup
let servicesCache: Array<{ id: string; name: string }> | null = null;
async function getServices() {
  if (!servicesCache) servicesCache = await api<Array<{ id: string; name: string }>>('/services');
  return servicesCache;
}

async function resolveServiceIds(category: string | null): Promise<string[]> {
  const name = category ? CATEGORY_TO_SERVICE[category] : undefined;
  if (!name) return [];
  const services = await getServices();
  const match = services.find((s) => s.name.toLowerCase() === name.toLowerCase());
  return match ? [match.id] : [];
}

// Cuisine name -> UUID (from GET /vendors/cuisines), resolved at runtime.
let cuisinesCache: Array<{ id: string; name: string }> | null = null;
async function resolveCuisineIds(names: string[]): Promise<string[]> {
  if (!names.length) return [];
  if (!cuisinesCache) cuisinesCache = await api<Array<{ id: string; name: string }>>('/vendors/cuisines');
  const byName = new Map(cuisinesCache.map((c) => [c.name.toLowerCase(), c.id]));
  return names.map((n) => byName.get(n.toLowerCase())).filter((v): v is string => !!v);
}

// The API validates logo/banner/menu URLs with IsUrl, so only forward real
// http(s) blob URLs (skip local blob: previews when Azure isn't configured).
const isHttpUrl = (u?: string): u is string => !!u && /^https?:\/\//i.test(u);

// ---------------------------------------------------------------- Uploads (direct to Azure)
export async function uploadFile(file: File, kind: string, onProgress?: (pct: number) => void): Promise<UploadedFile> {
  if (AZURE_DIRECT_UPLOAD) return uploadToAzure(file, kind, onProgress);
  for (let p = 0; p <= 100; p += 20) { onProgress?.(p); await wait(120); }
  return {
    blobName: `${kind}/${Date.now()}-${file.name}`,
    url: URL.createObjectURL(file),
    fileName: file.name,
    size: file.size,
    contentType: file.type,
  };
}

// ---------------------------------------------------------------- Submit (orchestration)
export interface SubmitResult { vendorId: string; referenceId: string; skipped: string[] }

const hhmmss = (t: string) => (t.length === 5 ? `${t}:00` : t);

// Serialize a coordinate at full precision as a plain decimal string
// (never scientific notation) so the exact pinpoint lat/long is stored.
function coord(n: number): string {
  const s = String(n);
  return /[eE]/.test(s) ? n.toFixed(12).replace(/\.?0+$/, '') : s;
}

function buildDocuments(d: RegistrationData) {
  const docs: Array<{ document_type_id: string; document_url: string; document_number?: string }> = [];
  const add = (key: 'pan' | 'gst' | 'fssai', file: UploadedFile | null, number: string) => {
    const typeId = DOC_TYPE_IDS[key];
    if (typeId && file) docs.push({ document_type_id: typeId, document_url: file.url, document_number: number || undefined });
  };
  add('pan', d.panDoc, d.panNumber);
  add('gst', d.gstDoc, d.gstNumber);
  add('fssai', d.fssaiDoc, d.fssaiNumber);
  return docs;
}

export async function submitRegistration(data: RegistrationData): Promise<SubmitResult> {
  if (MOCK_MODE) {
    await wait(1200);
    const ref = 'HATO-' + Math.abs(hashCode(data.phone + data.businessName)).toString(36).toUpperCase().slice(0, 6);
    return { vendorId: `mock-${Date.now()}`, referenceId: ref, skipped: [] };
  }

  const userId = getUserId();
  if (!userId) throw new Error('Your session has expired. Please verify your phone number again.');

  const skipped: string[] = [];
  const isFood = categoryById(data.category)?.foodLike ?? false;

  // 1) Profile.
  const profile: Record<string, string> = {
    fname: data.firstName,
    lname: data.lastName,
    avatar_url: data.restaurantImages[0]?.url ?? '',
    status: 'OFFLINE',
  };
  if (data.email) profile.email = data.email; // optional + IsEmail-validated server-side
  await api(`/users/register/${userId}`, { method: 'POST', auth: true, body: profile });

  // 2) Business (name, contact email/phone, logo/banner). Must exist before menu.
  const business: Record<string, string> = {
    business_name: data.businessName,
    business_phone: `${data.countryCode}${data.phone}`,
  };
  if (data.email) business.business_email = data.email;
  if (isHttpUrl(data.restaurantImages[0]?.url)) business.logo_url = data.restaurantImages[0].url;
  if (isHttpUrl(data.restaurantImages[1]?.url)) business.banner_url = data.restaurantImages[1].url;
  await api(`/vendors/business/${userId}`, { method: 'PUT', auth: true, body: business });

  // 3) Service / category.
  const serviceIds = await resolveServiceIds(data.category);
  if (serviceIds.length) {
    await api(`/users/vendor-service/${userId}`, { method: 'POST', auth: true, body: { service_ids: serviceIds } });
  } else {
    skipped.push('service (no matching backend service for this category)');
  }

  // 4) Location — always store the exact pinpoint lat/long (detailed text
  //    address + city have no API field yet, so they stay client-side).
  if (data.location) {
    await api(`/users/me/${userId}/location`, {
      method: 'PUT',
      auth: true,
      body: { latitude: coord(data.location.lat), longitude: coord(data.location.lng) },
    });
  } else {
    skipped.push('location (no map pin was set)');
  }

  // 5) Cuisines (food only; requires a non-empty array of UUIDs).
  if (isFood) {
    const cuisineIds = await resolveCuisineIds(data.cuisines);
    if (cuisineIds.length) {
      await api(`/users/vendor-cuisines/${userId}`, { method: 'PUT', auth: true, body: { cuisine_ids: cuisineIds } });
    }
  }

  // 6) Operational hours (food only — only the food flow collects them).
  if (isFood) {
    const availability = data.hours.days.map((day) => ({
      day_of_week: day,
      opening_time: hhmmss(data.hours.openTime),
      closing_time: hhmmss(data.hours.closeTime),
      is_closed: false,
    }));
    if (availability.length) {
      await api(`/users/vendor-availability/${userId}`, { method: 'PUT', auth: true, body: { availability } });
    }
  }

  // 7) Menu images/files (food only; requires a non-empty array of URLs).
  if (isFood) {
    const menu = data.menuImages
      .filter((f) => isHttpUrl(f.url))
      .map((f, i) => ({
        file_url: f.url,
        file_type: f.contentType.split('/')[1] || undefined,
        page_number: i + 1,
        upload_source: 'WEB',
      }));
    if (menu.length) await api(`/users/vendor-menu/${userId}`, { method: 'PUT', auth: true, body: { menu } });
  }

  // 8) KYC documents (needs Document_Types UUIDs via env; otherwise skipped).
  const documents = buildDocuments(data);
  if (documents.length) {
    await api(`/users/vendor-documents/${userId}`, { method: 'PUT', auth: true, body: { documents } });
  } else {
    skipped.push('documents (set VITE_HATO_DOCTYPE_* UUIDs to enable)');
  }

  // 9) Bank / payout account.
  const b = data.bank;
  if (b.accountHolder && b.accountNumber && b.ifsc && b.bankName) {
    await api(`/vendors/bank-details/${userId}`, {
      method: 'PUT',
      auth: true,
      body: {
        account_holder_name: b.accountHolder,
        bank_name: b.bankName,
        account_number: b.accountNumber,
        ifsc_code: b.ifsc,
        is_primary: true,
      },
    });
  }

  return {
    vendorId: userId,
    referenceId: 'HATO-' + userId.replace(/-/g, '').slice(0, 6).toUpperCase(),
    skipped,
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

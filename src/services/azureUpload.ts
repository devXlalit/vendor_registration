// ============================================================
// Direct browser -> Azure Blob Storage upload.
//
// The client uploads files straight to the Azure container using a
// *container SAS URL* — the only Azure credential that is safe to expose
// to a browser. Provide it via env:
//
//   VITE_AZURE_BLOB_SAS_URL=https://<account>.blob.core.windows.net/<container>?<sas-token>
//
// The SAS should grant at least Create + Write (racwl -> "cw" is enough for
// upload). Mint it from Azure Portal (Shared access signature) or have the
// NestJS backend issue short-lived SAS tokens and hand them to the client.
//
// If the env var is absent the app stays in MOCK mode (local object URLs).
// ============================================================

import type { UploadedFile } from '../types';

const SAS_URL = import.meta.env.VITE_AZURE_BLOB_SAS_URL as string | undefined;

export const AZURE_DIRECT_UPLOAD = !!SAS_URL;

/** Split "https://acct.blob.core.windows.net/container?sas" into base + query. */
function parseSasUrl(url: string): { containerUrl: string; sas: string } {
  const q = url.indexOf('?');
  if (q === -1) throw new Error('VITE_AZURE_BLOB_SAS_URL must include a "?<sas-token>" query string');
  return { containerUrl: url.slice(0, q), sas: url.slice(q) };
}

function randomId(): string {
  // crypto.randomUUID is available in all modern browsers over https/localhost.
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.round(performance.now())}`;
}

// Attempt to create the container once per session. A container-scoped SAS
// can't create containers (and it already exists), so any failure is ignored —
// this only helps a broad SAS bootstrap a fresh container.
let containerEnsured = false;
async function ensureContainer(container: { createIfNotExists: () => Promise<unknown> }): Promise<void> {
  if (containerEnsured) return;
  containerEnsured = true;
  try {
    await container.createIfNotExists();
  } catch {
    /* container already exists or SAS lacks create scope */
  }
}

/**
 * Upload a single file directly to Azure Blob Storage.
 * @param file      the browser File
 * @param kind      logical bucket "folder" (restaurant-image, menu-image, pan, gst, fssai)
 * @param onProgress 0..100 progress callback
 */
export async function uploadToAzure(
  file: File,
  kind: string,
  onProgress?: (pct: number) => void,
): Promise<UploadedFile> {
  // Load the Azure SDK on demand so it's kept out of the initial bundle.
  const { ContainerClient } = await import('@azure/storage-blob');
  const { containerUrl, sas } = parseSasUrl(SAS_URL!);
  const container = new ContainerClient(`${containerUrl}${sas}`);
  await ensureContainer(container);

  const safeName = file.name.replace(/[^\w.-]/g, '_');
  const blobName = `${kind}/${randomId()}-${safeName}`;
  const blob = container.getBlockBlobClient(blobName);

  await blob.uploadData(file, {
    blobHTTPHeaders: { blobContentType: file.type || 'application/octet-stream' },
    onProgress: (ev) => onProgress?.(Math.round((ev.loadedBytes / file.size) * 100)),
  });

  return {
    blobName,
    // Clean URL without the SAS query — the backend can re-sign for reads.
    url: `${containerUrl}/${blobName}`,
    fileName: file.name,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
  };
}

# HATO Partners — Vendor Registration

A multi-step web app that onboards vendors onto **HATO** (the everyday super
app for food, grocery, rides, parcels and more — this app onboards the
storefront vendors: restaurants, grocery & fresh produce) and hands them off to the
native partner mobile app.

Built with **React 19 + TypeScript + Vite**. Brand color `#2979FF`.

## The flow
1. **Phone** — enter mobile number, send OTP
2. **Verify OTP** — 4-digit code with resend timer
3. **Account** — first/last name, email, city
4. **Category** — Restaurant, Grocery, Fruits & Vegetables (storefront vendors only; ride/parcel are helper-centric and excluded)
5. **Business info** — business name + location picked on a map
6. **Address** — detailed address fields
7. **Menu & operations** *(food only)* — photos, menu, cuisines, hours & days
8. **Documents** — PAN, GST *(optional)*, FSSAI *(food)*, bank details
9. **Review** — confirm everything, consent
10. **Success** — thank-you, application reference + tracker, deep link to the app

The flow adapts to the chosen category — non-food vendors skip the menu step
and the FSSAI document.

## Run it
```bash
npm install
npm run dev            # http://localhost:5173
```
Out of the box it runs in **demo mode** (no backend needed): any valid phone
works and the OTP is **`1234`**. Uploads and the map are fully interactive.

The app talks to the **Hato NestJS API** (`/api/v1`) for OTP + vendor data and
uploads files **directly to Azure Blob Storage**. See
[`ENDPOINT_MAPPING.md`](./ENDPOINT_MAPPING.md) for how each step maps to the
real endpoints (and which form fields the API can't store yet).
Configure via `.env.local` (copy from `.env.local.example`):
```bash
VITE_API_BASE_URL=http://localhost:3000   # Hato API origin (client adds /api/v1)
VITE_AZURE_BLOB_SAS_URL=https://<acct>.blob.core.windows.net/<container>?<sas>
```
Both are optional and independent — unset either to keep that part in mock mode.

## Project structure
```
src/
  components/     reusable UI (StepShell, Field, FileUpload, MapPicker, OtpInput…)
  screens/        one file per step
  context/        RegistrationContext — form state + localStorage persistence
  services/api.ts API client (real backend + mock fallback)
  services/azureUpload.ts  direct browser -> Azure Blob upload
  data/catalog.ts categories, cuisines, cities, days
  flow.ts         step order, progress + next/prev navigation
  types.ts        shared types (mirror the API payload)
  services/session.ts      deviceId + JWT/userId handling
ENDPOINT_MAPPING.md        how each step maps to the live Hato API
```

## Tech choices
- **Backend**: dedicated NestJS API (external) — this repo is frontend-only.
- **Maps**: Leaflet + OpenStreetMap (no API key) with Nominatim geocoding.
- **Uploads**: sent directly from the browser to Azure Blob Storage via a
  container SAS URL, with live progress.
- **Persistence**: in-progress registration is saved to `localStorage` so a
  refresh doesn't lose the vendor's work.

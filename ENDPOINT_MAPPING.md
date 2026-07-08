# Frontend → Hato API mapping

The web app now talks to the live Hato NestJS API. Base origin is
`VITE_API_BASE_URL`; the client adds the `/api/v1` prefix. Every response is a
`{ statusCode, message, data }` envelope. The API uses a strict
`ValidationPipe` (`whitelist` + `forbidNonWhitelisted`), so each request sends
**only** the fields its DTO declares.

## Flow → endpoints
Submit runs these sequentially, keyed by `userId`. Steps marked *(food)* only
run for the Restaurant category.

| Order | Data | Endpoint | Notes |
|---|---|---|---|
| — | Send OTP | `POST /auth/challenge` | `{ phone:"+9199…", deviceId, platform:"web", role:"VENDOR" }` → `{ challengeId }` |
| — | Resend | `POST /auth/resend/:challengeId` | keeps the same challenge |
| — | Verify OTP | `POST /auth/verify-otp` | `{ challengeId, otp, deviceId }` → `{ accessToken, refreshToken }`; **userId = JWT `sub`** |
| 1 | Profile | `POST /users/register/:userId` | `{ fname, lname, avatar_url, status, email? }` |
| 2 | Business | `PUT /vendors/business/:userId` | `{ business_name, business_phone, business_email?, logo_url?, banner_url? }` (logo/banner = 1st/2nd restaurant image) |
| 3 | Category | `POST /users/vendor-service/:userId` | `{ service_ids: [uuid] }` (resolved from `GET /services` by name) |
| 4 | Location | `PUT /users/me/:userId/location` | `{ latitude, longitude }` full-precision strings |
| 5 | Cuisines *(food)* | `PUT /users/vendor-cuisines/:userId` | `{ cuisine_ids: [uuid] }` (resolved from `GET /vendors/cuisines` by name) |
| 6 | Hours *(food)* | `PUT /users/vendor-availability/:userId` | `{ availability: [{ day_of_week, opening_time:"HH:MM:SS", closing_time, is_closed }] }` |
| 7 | Menu *(food)* | `PUT /users/vendor-menu/:userId` | `{ menu: [{ file_url, file_type?, page_number, upload_source:"WEB" }] }` |
| 8 | Documents | `PUT /users/vendor-documents/:userId` | `{ documents: [{ document_type_id, document_url, document_number }] }` |
| 9 | Bank | `PUT /vendors/bank-details/:userId` | `{ account_holder_name, bank_name, account_number, ifsc_code, is_primary }` |

`deviceId` is a stable per-browser UUID (localStorage). Files upload directly to
Azure Blob; only their https URLs are sent (logo/banner/menu are `IsUrl`-validated,
so `blob:` previews are skipped when Azure isn't configured).

Category → Service name map (in `api.ts`): `restaurant→Food`, `grocery→Grocery`,
`fruits_vegetables→Fruits & Vegetables`. (Ride/parcel/pharmacy are
helper-centric and intentionally excluded from vendor registration.)

## ⚠️ Data the form still collects but the API can't store
Only these remain unmapped (held client-side, persisted, ready to wire up):

| Field(s) | Note |
|---|---|
| **City** | no column/DTO (precise lat/long *is* stored) |
| **Detailed text address** (shop no., building, floor, area, locality, pincode) | `User_Location` stores lat/long only; no text-address field |

Extra restaurant photos beyond the first two (logo/banner) aren't stored — there's
no gallery field on `Businesses` yet.

## Needed to finish document submission
`Document_Types` has no list endpoint and isn't seeded in the repo, so the PAN /
GST / FSSAI `document_type_id` UUIDs must be provided via
`VITE_HATO_DOCTYPE_PAN` / `_GST` / `_FSSAI` (see `.env.local.example`). Without
them the documents call is skipped.

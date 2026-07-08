// ============================================================
// Shared types for the HATO vendor registration flow.
// These map to the NestJS API payload — see /API_CONTRACT.md and the
// toVendorPayload() reshaper in /src/services/api.ts.
// ============================================================

export type CategoryId =
  | 'restaurant'
  | 'grocery'
  | 'fruits_vegetables';

/** A file the vendor uploaded. `url` is the Azure Blob URL returned by the
 *  backend once the upload completes; `blobName` is the key inside the container. */
export interface UploadedFile {
  blobName: string;
  url: string;
  fileName: string;
  size: number;
  contentType: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export interface DetailedAddress {
  shopNo: string;
  building: string;
  floorTower: string;
  areaSector: string;
  locality: string;
  city: string;
  pincode: string;
}

export interface OperationalHours {
  openTime: string; // "09:00"
  closeTime: string; // "22:00"
  days: number[]; // 0=Sun ... 6=Sat
}

export interface BankDetails {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface RegistrationData {
  // Step 1-2 — phone verification
  phone: string;
  countryCode: string;
  phoneVerified: boolean;

  // Step 3 — account
  firstName: string;
  lastName: string;
  email: string;
  city: string;

  // Step 4 — category
  category: CategoryId | null;

  // Step 5 — business info
  businessName: string;
  location: GeoLocation | null;

  // Step 6 — detailed address
  address: DetailedAddress;

  // Step 7 — menu & operations
  restaurantImages: UploadedFile[];
  menuImages: UploadedFile[];
  cuisines: string[];
  hours: OperationalHours;

  // Step 8 — documents
  panNumber: string;
  panDoc: UploadedFile | null;
  gstNumber: string;
  gstDoc: UploadedFile | null;
  fssaiNumber: string;
  fssaiDoc: UploadedFile | null;
  bank: BankDetails;
}

export const emptyRegistration: RegistrationData = {
  phone: '',
  countryCode: '+91',
  phoneVerified: false,
  firstName: '',
  lastName: '',
  email: '',
  city: '',
  category: null,
  businessName: '',
  location: null,
  address: {
    shopNo: '',
    building: '',
    floorTower: '',
    areaSector: '',
    locality: '',
    city: '',
    pincode: '',
  },
  restaurantImages: [],
  menuImages: [],
  cuisines: [],
  hours: { openTime: '09:00', closeTime: '22:00', days: [1, 2, 3, 4, 5, 6, 0] },
  panNumber: '',
  panDoc: null,
  gstNumber: '',
  gstDoc: null,
  fssaiNumber: '',
  fssaiDoc: null,
  bank: { accountHolder: '', accountNumber: '', ifsc: '', bankName: '' },
};

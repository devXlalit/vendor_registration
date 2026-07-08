import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { emptyRegistration, type RegistrationData } from '../types';

const STORAGE_KEY = 'hato_vendor_registration';

interface Ctx {
  data: RegistrationData;
  update: (patch: Partial<RegistrationData>) => void;
  reset: () => void;
}

const RegistrationContext = createContext<Ctx | null>(null);

function load(): RegistrationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...emptyRegistration, ...JSON.parse(raw) };
  } catch {
    /* ignore corrupt storage */
  }
  return emptyRegistration;
}

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RegistrationData>(load);

  // Persist progress so a refresh mid-flow doesn't lose the vendor's work.
  // Object URLs from mock uploads are stripped — they don't survive reload.
  useEffect(() => {
    const safe: RegistrationData = {
      ...data,
      restaurantImages: data.restaurantImages.filter((f) => !f.url.startsWith('blob:')),
      menuImages: data.menuImages.filter((f) => !f.url.startsWith('blob:')),
      panDoc: data.panDoc?.url.startsWith('blob:') ? null : data.panDoc,
      gstDoc: data.gstDoc?.url.startsWith('blob:') ? null : data.gstDoc,
      fssaiDoc: data.fssaiDoc?.url.startsWith('blob:') ? null : data.fssaiDoc,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    } catch {
      /* storage full / disabled — non-fatal */
    }
  }, [data]);

  const value = useMemo<Ctx>(
    () => ({
      data,
      update: (patch) => setData((prev) => ({ ...prev, ...patch })),
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        setData(emptyRegistration);
      },
    }),
    [data],
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration(): Ctx {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistration must be used within RegistrationProvider');
  return ctx;
}

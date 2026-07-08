import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RegistrationProvider, useRegistration } from './context/RegistrationContext';
import { PhoneScreen } from './screens/PhoneScreen';
import { OtpScreen } from './screens/OtpScreen';
import { AccountScreen } from './screens/AccountScreen';
import { CategoryScreen } from './screens/CategoryScreen';
import { BusinessInfoScreen } from './screens/BusinessInfoScreen';
import { AddressScreen } from './screens/AddressScreen';
import { MenuScreen } from './screens/MenuScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { ReviewScreen } from './screens/ReviewScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import type { ReactNode } from 'react';

// Blocks the post-verification steps until the phone number is verified.
function RequireVerified({ children }: { children: ReactNode }) {
  const { data } = useRegistration();
  const location = useLocation();
  if (!data.phoneVerified) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <RegistrationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PhoneScreen />} />
          <Route path="/verify" element={<OtpScreen />} />
          <Route path="/account" element={<RequireVerified><AccountScreen /></RequireVerified>} />
          <Route path="/category" element={<RequireVerified><CategoryScreen /></RequireVerified>} />
          <Route path="/business" element={<RequireVerified><BusinessInfoScreen /></RequireVerified>} />
          <Route path="/address" element={<RequireVerified><AddressScreen /></RequireVerified>} />
          <Route path="/menu" element={<RequireVerified><MenuScreen /></RequireVerified>} />
          <Route path="/documents" element={<RequireVerified><DocumentsScreen /></RequireVerified>} />
          <Route path="/review" element={<RequireVerified><ReviewScreen /></RequireVerified>} />
          <Route path="/success" element={<RequireVerified><SuccessScreen /></RequireVerified>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </RegistrationProvider>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { TextField } from '../components/Field';
import { useRegistration } from '../context/RegistrationContext';
import { categoryById } from '../data/catalog';
import type { DetailedAddress } from '../types';
import { MapPin } from '../components/Icons';

export function AddressScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const isFood = categoryById(data.category)?.foodLike;

  // Prefill city from the account step / map selection if empty.
  const [addr, setAddr] = useState<DetailedAddress>({
    ...data.address,
    city: data.address.city || data.city,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof DetailedAddress, v: string) => {
    setAddr((a) => ({ ...a, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!addr.shopNo.trim()) e.shopNo = 'Required';
    if (!addr.areaSector.trim()) e.areaSector = 'Required';
    if (!addr.locality.trim()) e.locality = 'Required';
    if (!addr.city.trim()) e.city = 'Required';
    if (!/^\d{6}$/.test(addr.pincode)) e.pincode = 'Enter a 6-digit pincode';
    setErrors(e);
    if (Object.keys(e).length) return;
    update({ address: addr });
    navigate(isFood ? '/menu' : '/documents');
  };

  return (
    <StepShell
      path="/address"
      back="/business"
      eyebrow="Address"
      title="Complete your address"
      subtitle="This helps our delivery partners reach your doorstep quickly and accurately."
      footer={<Button onClick={submit}>Continue</Button>}
    >
      {data.location && (
        <div className="helper-note">
          <MapPin size={16} />
          <span>Pinned on map: {data.location.formattedAddress}</span>
        </div>
      )}

      <div className="two-col">
        <TextField label={<>Shop / Flat no. <span className="req">*</span></>} placeholder="Shop 12" value={addr.shopNo} error={errors.shopNo} onChange={(e) => set('shopNo', e.target.value)} />
        <TextField label="Building / Complex name" placeholder="Sunrise Plaza" value={addr.building} onChange={(e) => set('building', e.target.value)} />
      </div>
      <div className="two-col">
        <TextField label="Floor / Tower" placeholder="2nd floor, Tower B" value={addr.floorTower} onChange={(e) => set('floorTower', e.target.value)} />
        <TextField label={<>Area / Sector <span className="req">*</span></>} placeholder="Sector 45" value={addr.areaSector} error={errors.areaSector} onChange={(e) => set('areaSector', e.target.value)} />
      </div>
      <TextField label={<>Locality / Landmark <span className="req">*</span></>} placeholder="Near City Hospital" value={addr.locality} error={errors.locality} onChange={(e) => set('locality', e.target.value)} />
      <div className="two-col">
        <TextField label={<>City <span className="req">*</span></>} placeholder="Bengaluru" value={addr.city} error={errors.city} onChange={(e) => set('city', e.target.value)} />
        <TextField label={<>Pincode <span className="req">*</span></>} inputMode="numeric" maxLength={6} placeholder="560045" value={addr.pincode} error={errors.pincode} onChange={(e) => set('pincode', e.target.value.replace(/\D/g, ''))} />
      </div>
    </StepShell>
  );
}

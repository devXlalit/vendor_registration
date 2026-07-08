import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { TextField } from '../components/Field';
import { MapPicker } from '../components/MapPicker';
import { useRegistration } from '../context/RegistrationContext';
import { categoryById } from '../data/catalog';
import type { GeoLocation } from '../types';

export function BusinessInfoScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const cat = categoryById(data.category);
  const isFood = cat?.foodLike;

  const [name, setName] = useState(data.businessName);
  const [location, setLocation] = useState<GeoLocation | null>(data.location);
  const [errors, setErrors] = useState<{ name?: string; location?: string }>({});

  const nameLabel = isFood ? 'Restaurant name (as per FSSAI certificate)' : `${cat?.label ?? 'Business'} name`;

  const submit = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Business name is required.';
    if (!location) e.location = 'Please pin your location on the map.';
    setErrors(e);
    if (Object.keys(e).length) return;
    update({ businessName: name, location });
    navigate('/address');
  };

  return (
    <StepShell
      path="/business"
      back="/category"
      eyebrow={cat?.label ?? 'Business'}
      title="Where is your business located?"
      subtitle="Add your registered business name and mark your exact location so customers and delivery partners can find you."
      footer={<Button onClick={submit}>Continue</Button>}
    >
      <TextField
        label={<>{nameLabel} <span className="req">*</span></>}
        placeholder={isFood ? 'e.g. Spice Garden Restaurant' : 'e.g. Fresh Mart'}
        value={name}
        error={errors.name}
        onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
      />

      <div className="field">
        <label>Business location <span className="req">*</span></label>
        <MapPicker value={location} onChange={(loc) => { setLocation(loc); setErrors((p) => ({ ...p, location: '' })); }} />
        {errors.location && <div className="field__error" style={{ marginTop: 8 }}>{errors.location}</div>}
      </div>
    </StepShell>
  );
}

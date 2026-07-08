import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { TextField, SelectField } from '../components/Field';
import { useRegistration } from '../context/RegistrationContext';
import { CITIES } from '../data/catalog';

export function AccountScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const [form, setForm] = useState({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    city: data.city,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim()) e.lastName = 'Last name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.city.trim()) e.city = 'Please select your city.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    update(form);
    navigate('/category');
  };

  return (
    <StepShell
      path="/account"
      back="/verify"
      eyebrow="About you"
      title="Create your account"
      subtitle="Tell us who's running the show. This is the primary contact for your HATO partner account."
      footer={<Button onClick={submit}>Continue</Button>}
    >
      <div className="two-col">
        <TextField label={<>First name <span className="req">*</span></>} placeholder="Aarav" value={form.firstName} error={errors.firstName} onChange={(e) => set('firstName', e.target.value)} />
        <TextField label={<>Last name <span className="req">*</span></>} placeholder="Sharma" value={form.lastName} error={errors.lastName} onChange={(e) => set('lastName', e.target.value)} />
      </div>
      <TextField
        label={<>Email address <span className="req">*</span></>}
        type="email"
        placeholder="you@business.com"
        value={form.email}
        error={errors.email}
        hint="We'll send order updates and payout summaries here."
        onChange={(e) => set('email', e.target.value)}
      />
      <SelectField label={<>City <span className="req">*</span></>} value={form.city} error={errors.city} onChange={(e) => set('city', e.target.value)}>
        <option value="">Select your city</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </SelectField>
    </StepShell>
  );
}

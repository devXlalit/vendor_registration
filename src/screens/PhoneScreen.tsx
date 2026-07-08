import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { useRegistration } from '../context/RegistrationContext';
import { sendOtp, MOCK_MODE } from '../services/api';
import { Info } from '../components/Icons';

export function PhoneScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const [phone, setPhone] = useState(data.phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /^[6-9]\d{9}$/.test(phone);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await sendOtp(data.countryCode, phone);
      update({ phone, phoneVerified: false });
      sessionStorage.setItem('otp_request', JSON.stringify({ requestId: res.requestId, expiresInSec: res.expiresInSec }));
      navigate('/verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      path="/"
      eyebrow="Become a HATO Partner"
      title="Enter your phone number"
      subtitle="We'll send a one-time password to verify it's really you."
      footer={
        <form onSubmit={submit}>
          <Button type="submit" loading={loading} disabled={!valid}>Send OTP</Button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-500)', marginTop: 16 }}>
            By continuing you agree to HATO's <a href="#">Terms</a> & <a href="#">Privacy Policy</a>.
          </p>
        </form>
      }
    >
      <form onSubmit={submit}>
        <div className="field">
          <label>Mobile number <span className="req">*</span></label>
          <div className="input-group">
            <span className="input-group__prefix">🇮🇳 {data.countryCode}</span>
            <input
              className="input"
              inputMode="numeric"
              autoFocus
              placeholder="98765 43210"
              value={phone}
              maxLength={10}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError(null); }}
            />
          </div>
          {error && <div className="field__error" style={{ marginTop: 6 }}><Info size={14} /> {error}</div>}
        </div>

        {MOCK_MODE && (
          <div className="helper-note">
            <Info size={16} />
            <span>Demo mode — no backend connected. Any valid number works and the OTP is <b>123456</b>.</span>
          </div>
        )}
      </form>
    </StepShell>
  );
}

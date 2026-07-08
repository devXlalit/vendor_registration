import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { OtpInput } from '../components/OtpInput';
import { useRegistration } from '../context/RegistrationContext';
import { resendOtp, verifyOtp } from '../services/api';

function getRequest() {
  try {
    return JSON.parse(sessionStorage.getItem('otp_request') || '{}');
  } catch {
    return {};
  }
}

export function OtpScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [requestId, setRequestId] = useState<string>(() => getRequest().requestId || `mock-${data.phone}`);

  // No phone captured yet — bounce back to step 1.
  useEffect(() => {
    if (!data.phone) navigate('/', { replace: true });
  }, [data.phone, navigate]);

  // Countdown until resend is allowed.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const verify = async (value: string) => {
    setLoading(true);
    setError(null);
    try {
      const ok = await verifyOtp(requestId, value);
      if (ok) {
        update({ phoneVerified: true });
        sessionStorage.removeItem('otp_request');
        navigate('/account');
      } else {
        setError('Incorrect code. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setCode('');
    try {
      const res = await resendOtp(requestId);
      setRequestId(res.requestId);
      setSecondsLeft(res.expiresInSec || 60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend the code. Please try again.');
    }
  };

  return (
    <StepShell
      path="/verify"
      back="/"
      eyebrow="Verification"
      title="Verify your number"
      subtitle={`Enter the 6-digit code we sent to ${data.countryCode} ${data.phone}.`}
      footer={
        <Button onClick={() => verify(code)} loading={loading} disabled={code.length !== 6}>
          Verify OTP
        </Button>
      }
    >
      <OtpInput
        length={6}
        value={code}
        onChange={(v) => {
          setCode(v);
          setError(null);
          if (v.length === 6) verify(v);
        }}
      />
      {error && <div className="field__error" style={{ marginTop: 12, justifyContent: 'center' }}>{error}</div>}

      <div className="resend">
        {secondsLeft > 0 ? (
          <>Didn't get it? Resend in <strong>0:{String(secondsLeft).padStart(2, '0')}</strong></>
        ) : (
          <>Didn't get the code? <button onClick={resend}>Resend OTP</button></>
        )}
      </div>
    </StepShell>
  );
}

import { useEffect } from 'react';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { useRegistration } from '../context/RegistrationContext';
import { Check, Apple, Play, ArrowRight } from '../components/Icons';

// Deep link back into the HATO partner mobile app + store fallbacks.
const APP_DEEP_LINK = 'hatopartner://onboarding/complete';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.hato.partner';
const APP_STORE = 'https://apps.apple.com/app/hato-partner/id000000000';

const TRACKER = [
  { title: 'Application submitted', desc: 'We\'ve received your details.', state: 'done' },
  { title: 'Under review', desc: 'Our team verifies your documents (usually within 24–48 hrs).', state: 'active' },
  { title: 'Account approved', desc: 'You\'ll get an SMS & email once approved.', state: 'todo' },
  { title: 'Start receiving orders', desc: 'Go live from the HATO Partner app.', state: 'todo' },
] as const;

export function SuccessScreen() {
  const { data } = useRegistration();
  const reference = sessionStorage.getItem('hato_reference') || 'HATO-PENDING';

  // Attempt to bounce back into the native app if opened from it.
  const openApp = () => {
    window.location.href = APP_DEEP_LINK;
    setTimeout(() => { window.location.href = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? APP_STORE : PLAY_STORE; }, 1200);
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <StepShell title="" wide>
      <div className="success-wrap">
        <div className="success-badge"><Check size={44} /></div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px' }}>Thanks for registering with HATO!</h1>
        <p style={{ color: 'var(--ink-500)', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Welcome aboard, {data.firstName}. <strong>{data.businessName}</strong> is now in our onboarding queue.
        </p>

        <div className="ref-box" style={{ marginTop: 22 }}>
          Your application reference number<br />
          <b>{reference}</b>
        </div>

        <div className="tracker">
          {TRACKER.map((t, i) => (
            <div key={t.title} className={`tracker__item tracker__item--${t.state}`}>
              <div className="tracker__dot">
                <i />
                {i < TRACKER.length - 1 && <div className="tracker__line" />}
              </div>
              <div className="tracker__body">
                <strong>{t.title}</strong>
                <span>{t.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={openApp}>Open the HATO Partner app <ArrowRight size={18} /></Button>

        <div className="divider">or download the app</div>
        <div className="store-badges">
          <a className="store-badge" href={APP_STORE} target="_blank" rel="noreferrer"><Apple size={18} /> App Store</a>
          <a className="store-badge" href={PLAY_STORE} target="_blank" rel="noreferrer"><Play size={16} /> Google Play</a>
        </div>

        <p style={{ fontSize: 13, color: 'var(--ink-400)', marginTop: 24 }}>
          Track your application status anytime in the app using your reference number.
        </p>
      </div>
    </StepShell>
  );
}

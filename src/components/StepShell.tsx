import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { ArrowLeft, Check, Shield } from './Icons';
import { useRegistration } from '../context/RegistrationContext';
import { progressFor } from '../flow';

interface Props {
  /** Current route path — drives the progress bar. */
  path?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Path to navigate to on back; omit to hide the back button. */
  back?: string;
  children: ReactNode;
  /** Sticky footer content (usually the primary button). */
  footer?: ReactNode;
  /** Hide the brand marketing panel (used on the success screen). */
  wide?: boolean;
}

const BRAND_FEATURES = [
  'Reach millions of HATO customers',
  'Zero setup fee, quick onboarding',
  'Daily payouts to your bank account',
  'Live orders & insights in one app',
];

export function StepShell({ path, eyebrow, title, subtitle, back, children, footer }: Props) {
  const navigate = useNavigate();
  const { data } = useRegistration();
  const progress = path ? progressFor(path, data) : null;
  const showProgress = progress && progress.current > 0;

  return (
    <div className="app-shell">
      <aside className="brand-panel">
        <div className="brand-panel__logo">
          <Logo size={44} />
          <span>HATO Partners</span>
        </div>
        <div className="brand-panel__headline">
          <h2>Grow your business with India's everyday super app.</h2>
          <p>Restaurants, grocery & fresh produce — one partner account, one growing customer base.</p>
          <ul className="brand-features">
            {BRAND_FEATURES.map((f) => (
              <li key={f}>
                <span className="tick"><Check size={14} /></span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="brand-panel__foot">
          <Shield size={14} /> &nbsp;Your documents are encrypted and stored securely.
        </div>
      </aside>

      <main className="form-area">
        <div className="mobile-brand">
          <Logo size={32} />
          <span>HATO Partners</span>
        </div>

        {showProgress && (
          <div className="progress">
            <div className="progress__meta">
              <span>Step {progress!.current} of {progress!.total}</span>
              <span>{Math.round((progress!.current / progress!.total) * 100)}%</span>
            </div>
            <div className="progress__track">
              <div className="progress__fill" style={{ width: `${(progress!.current / progress!.total) * 100}%` }} />
            </div>
          </div>
        )}

        <section className="step-card">
          {back && (
            <button className="back-link" onClick={() => navigate(back)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          {(eyebrow || title || subtitle) && (
            <header className="step-head">
              {eyebrow && <div className="step-head__eyebrow">{eyebrow}</div>}
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </header>
          )}

          {children}

          {footer && <div style={{ marginTop: 24 }}>{footer}</div>}
        </section>
      </main>
    </div>
  );
}

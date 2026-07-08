import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { useRegistration } from '../context/RegistrationContext';
import { categoryById, CUISINES, DAY_NAMES } from '../data/catalog';
import { submitRegistration } from '../services/api';
import { Edit, User, Store, MapPin, Camera, FileIcon } from '../components/Icons';
import type { UploadedFile } from '../types';

function Section({ title, icon, editTo, children }: { title: string; icon: ReactNode; editTo: string; children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="review-section">
      <div className="review-section__head">
        <h3>{icon} {title}</h3>
        <button className="review-section__edit" onClick={() => navigate(editTo)}><Edit size={13} /> Edit</button>
      </div>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  if (v === '' || v == null) return null;
  return (
    <li><span className="k">{k}</span><span className="v">{v}</span></li>
  );
}

function Thumbs({ files }: { files: UploadedFile[] }) {
  if (!files.length) return null;
  return (
    <div className="review-thumbs">
      {files.map((f) => (f.contentType.startsWith('image/')
        ? <img key={f.blobName} src={f.url} alt={f.fileName} />
        : <span key={f.blobName} className="doc-chip"><FileIcon /></span>))}
    </div>
  );
}

export function ReviewScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const cat = categoryById(data.category);
  const isFood = cat?.foodLike;
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const a = data.address;
  const openDays = [...data.hours.days].sort().map((d) => DAY_NAMES[d]).join(', ');

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await submitRegistration(data);
      sessionStorage.setItem('hato_reference', res.referenceId);
      update({}); // trigger persist
      navigate('/success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      path="/review"
      back="/documents"
      eyebrow="Almost done"
      title="Review your details"
      subtitle="Please confirm everything looks right before you submit. You can edit any section."
      footer={
        <>
          {error && <div className="field__error" style={{ marginBottom: 12 }}>{error}</div>}
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I confirm the information and documents provided are accurate, and I agree to HATO's Partner <a href="#">Terms of Service</a>.</span>
          </label>
          <Button onClick={submit} loading={loading} disabled={!consent}>Submit registration</Button>
        </>
      }
    >
      <Section title="Your details" icon={<User size={16} />} editTo="/account">
        <ul className="review-list">
          <Row k="Name" v={`${data.firstName} ${data.lastName}`} />
          <Row k="Phone" v={`${data.countryCode} ${data.phone}`} />
          <Row k="Email" v={data.email} />
          <Row k="City" v={data.city} />
        </ul>
      </Section>

      <Section title="Business" icon={<Store size={16} />} editTo="/business">
        <ul className="review-list">
          <Row k="Category" v={<>{cat?.emoji} {cat?.label}</>} />
          <Row k="Name" v={data.businessName} />
        </ul>
      </Section>

      <Section title="Address & location" icon={<MapPin size={16} />} editTo="/address">
        <ul className="review-list">
          <Row k="Address" v={[a.shopNo, a.building, a.floorTower, a.areaSector, a.locality].filter(Boolean).join(', ')} />
          <Row k="City / Pincode" v={`${a.city} - ${a.pincode}`} />
          <Row k="Map" v={data.location?.formattedAddress} />
        </ul>
      </Section>

      {isFood && (
        <Section title="Menu & operations" icon={<Camera size={16} />} editTo="/menu">
          <ul className="review-list">
            <Row k="Cuisines" v={data.cuisines.filter((c) => CUISINES.includes(c)).join(', ')} />
            <Row k="Hours" v={`${data.hours.openTime} - ${data.hours.closeTime}`} />
            <Row k="Open on" v={openDays} />
          </ul>
          <Thumbs files={[...data.restaurantImages, ...data.menuImages]} />
        </Section>
      )}

      <Section title="Documents & bank" icon={<FileIcon size={16} />} editTo="/documents">
        <ul className="review-list">
          <Row k="PAN" v={data.panNumber} />
          <Row k="GST" v={data.gstNumber || '—'} />
          {isFood && <Row k="FSSAI" v={data.fssaiNumber} />}
          <Row k="Bank" v={data.bank.bankName} />
          <Row k="Account" v={data.bank.accountNumber && `••••${data.bank.accountNumber.slice(-4)}`} />
          <Row k="IFSC" v={data.bank.ifsc} />
        </ul>
        <Thumbs files={[data.panDoc, data.gstDoc, data.fssaiDoc].filter(Boolean) as UploadedFile[]} />
      </Section>
    </StepShell>
  );
}

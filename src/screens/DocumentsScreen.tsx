import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { TextField } from '../components/Field';
import { FileUpload } from '../components/FileUpload';
import { useRegistration } from '../context/RegistrationContext';
import { categoryById } from '../data/catalog';
import type { BankDetails, UploadedFile } from '../types';
import { Shield } from '../components/Icons';

const single = (f: UploadedFile | null): UploadedFile[] => (f ? [f] : []);

export function DocumentsScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const isFood = categoryById(data.category)?.foodLike;

  const [panNumber, setPanNumber] = useState(data.panNumber);
  const [panDoc, setPanDoc] = useState<UploadedFile | null>(data.panDoc);
  const [gstNumber, setGstNumber] = useState(data.gstNumber);
  const [gstDoc, setGstDoc] = useState<UploadedFile | null>(data.gstDoc);
  const [fssaiNumber, setFssaiNumber] = useState(data.fssaiNumber);
  const [fssaiDoc, setFssaiDoc] = useState<UploadedFile | null>(data.fssaiDoc);
  const [bank, setBank] = useState<BankDetails>(data.bank);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setBankField = (k: keyof BankDetails, v: string) => {
    setBank((b) => ({ ...b, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = () => {
    const e: Record<string, string> = {};
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(panNumber.toUpperCase())) e.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F).';
    if (!panDoc) e.panDoc = 'Upload your PAN card.';
    if (gstNumber && gstNumber.length !== 15) e.gstNumber = 'GSTIN should be 15 characters.';
    if (isFood) {
      if (!/^\d{14}$/.test(fssaiNumber)) e.fssaiNumber = 'FSSAI licence number is 14 digits.';
      if (!fssaiDoc) e.fssaiDoc = 'Upload your FSSAI certificate.';
    }
    if (!bank.accountHolder.trim()) e.accountHolder = 'Required';
    if (!/^\d{9,18}$/.test(bank.accountNumber)) e.accountNumber = 'Enter a valid account number.';
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc.toUpperCase())) e.ifsc = 'Enter a valid IFSC code.';
    if (!bank.bankName.trim()) e.bankName = 'Required';
    setErrors(e);
    if (Object.keys(e).length) return;

    update({
      panNumber: panNumber.toUpperCase(),
      panDoc,
      gstNumber: gstNumber.toUpperCase(),
      gstDoc,
      fssaiNumber,
      fssaiDoc,
      bank: { ...bank, ifsc: bank.ifsc.toUpperCase() },
    });
    navigate('/review');
  };

  return (
    <StepShell
      path="/documents"
      back={isFood ? '/menu' : '/address'}
      eyebrow="Verification"
      title="Upload your documents"
      subtitle="These are required to verify your business and enable payouts. All files are encrypted."
      footer={<Button onClick={submit}>Review details</Button>}
    >
      <div className="helper-note">
        <Shield size={16} />
        <span>Your documents are stored securely on Microsoft Azure and used only for verification and payouts.</span>
      </div>

      {/* PAN */}
      <div className="section-label">PAN details</div>
      <TextField
        label={<>PAN number <span className="req">*</span></>}
        placeholder="ABCDE1234F"
        style={{ textTransform: 'uppercase' }}
        maxLength={10}
        value={panNumber}
        error={errors.panNumber}
        onChange={(e) => { setPanNumber(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, panNumber: '' })); }}
      />
      <div className="field">
        <label>Upload PAN card <span className="req">*</span></label>
        <FileUpload kind="pan" files={single(panDoc)} onChange={(f) => setPanDoc(f[0] ?? null)} title="Upload PAN card" />
        {errors.panDoc && <div className="field__error" style={{ marginTop: 8 }}>{errors.panDoc}</div>}
      </div>

      {/* GST — optional */}
      <div className="section-label">GST details</div>
      <TextField
        label="GSTIN"
        optional
        placeholder="22ABCDE1234F1Z5"
        style={{ textTransform: 'uppercase' }}
        maxLength={15}
        value={gstNumber}
        error={errors.gstNumber}
        onChange={(e) => { setGstNumber(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, gstNumber: '' })); }}
      />
      <div className="field">
        <label>Upload GST certificate <span className="optional">(optional)</span></label>
        <FileUpload kind="gst" files={single(gstDoc)} onChange={(f) => setGstDoc(f[0] ?? null)} title="Upload GST certificate" />
      </div>

      {/* FSSAI — food only */}
      {isFood && (
        <>
          <div className="section-label">FSSAI details</div>
          <TextField
            label={<>FSSAI licence number <span className="req">*</span></>}
            placeholder="12345678901234"
            inputMode="numeric"
            maxLength={14}
            value={fssaiNumber}
            error={errors.fssaiNumber}
            onChange={(e) => { setFssaiNumber(e.target.value.replace(/\D/g, '')); setErrors((p) => ({ ...p, fssaiNumber: '' })); }}
          />
          <div className="field">
            <label>Upload FSSAI certificate <span className="req">*</span></label>
            <FileUpload kind="fssai" files={single(fssaiDoc)} onChange={(f) => setFssaiDoc(f[0] ?? null)} title="Upload FSSAI certificate" />
            {errors.fssaiDoc && <div className="field__error" style={{ marginTop: 8 }}>{errors.fssaiDoc}</div>}
          </div>
        </>
      )}

      {/* Bank */}
      <div className="section-label">Bank account for payouts</div>
      <TextField label={<>Account holder name <span className="req">*</span></>} placeholder="As per bank records" value={bank.accountHolder} error={errors.accountHolder} onChange={(e) => setBankField('accountHolder', e.target.value)} />
      <div className="two-col">
        <TextField label={<>Account number <span className="req">*</span></>} inputMode="numeric" placeholder="000123456789" value={bank.accountNumber} error={errors.accountNumber} onChange={(e) => setBankField('accountNumber', e.target.value.replace(/\D/g, ''))} />
        <TextField label={<>IFSC code <span className="req">*</span></>} placeholder="HDFC0001234" style={{ textTransform: 'uppercase' }} maxLength={11} value={bank.ifsc} error={errors.ifsc} onChange={(e) => setBankField('ifsc', e.target.value.toUpperCase())} />
      </div>
      <TextField label={<>Bank name <span className="req">*</span></>} placeholder="HDFC Bank" value={bank.bankName} error={errors.bankName} onChange={(e) => setBankField('bankName', e.target.value)} />
    </StepShell>
  );
}

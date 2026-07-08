import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { FileUpload } from '../components/FileUpload';
import { useRegistration } from '../context/RegistrationContext';
import { CUISINES, DAYS } from '../data/catalog';
import { Camera, Clock } from '../components/Icons';
import type { UploadedFile } from '../types';

export function MenuScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();

  const [restaurantImages, setRestaurantImages] = useState<UploadedFile[]>(data.restaurantImages);
  const [menuImages, setMenuImages] = useState<UploadedFile[]>(data.menuImages);
  const [cuisines, setCuisines] = useState<string[]>(data.cuisines);
  const [hours, setHours] = useState(data.hours);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleCuisine = (c: string) =>
    setCuisines((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const toggleDay = (d: number) =>
    setHours((h) => ({ ...h, days: h.days.includes(d) ? h.days.filter((x) => x !== d) : [...h.days, d] }));

  const submit = () => {
    const e: Record<string, string> = {};
    if (restaurantImages.length === 0) e.restaurant = 'Add at least one photo of your restaurant.';
    if (menuImages.length === 0) e.menu = 'Upload at least one menu image.';
    if (cuisines.length === 0) e.cuisine = 'Select at least one cuisine.';
    if (hours.days.length === 0) e.days = 'Select your operating days.';
    if (hours.openTime >= hours.closeTime) e.time = 'Closing time must be after opening time.';
    setErrors(e);
    if (Object.keys(e).length) return;
    update({ restaurantImages, menuImages, cuisines, hours });
    navigate('/documents');
  };

  return (
    <StepShell
      path="/menu"
      back="/address"
      eyebrow="Menu & operations"
      title="Show customers what you offer"
      subtitle="Add photos, your menu and when you're open. Great photos help you get more orders."
      footer={<Button onClick={submit}>Continue</Button>}
    >
      <div className="field">
        <label><Camera size={16} /> &nbsp;Restaurant photos <span className="req">*</span></label>
        <FileUpload
          kind="restaurant-image"
          accept="image/*"
          multiple
          files={restaurantImages}
          onChange={setRestaurantImages}
          title="Add restaurant photos"
          hint="Storefront, seating & signature dishes · JPG/PNG up to 5MB"
        />
        {errors.restaurant && <div className="field__error" style={{ marginTop: 8 }}>{errors.restaurant}</div>}
      </div>

      <div className="field">
        <label>Menu photos <span className="req">*</span></label>
        <FileUpload
          kind="menu-image"
          accept="image/*,application/pdf"
          multiple
          files={menuImages}
          onChange={setMenuImages}
          title="Upload your menu"
          hint="Clear photos or a PDF of your full menu"
        />
        {errors.menu && <div className="field__error" style={{ marginTop: 8 }}>{errors.menu}</div>}
      </div>

      <div className="field">
        <label>Cuisines served <span className="req">*</span></label>
        <div className="chip-wrap">
          {CUISINES.map((c) => (
            <button key={c} type="button" className={`chip ${cuisines.includes(c) ? 'chip--active' : ''}`} onClick={() => toggleCuisine(c)}>
              {c}
            </button>
          ))}
        </div>
        {errors.cuisine && <div className="field__error" style={{ marginTop: 8 }}>{errors.cuisine}</div>}
      </div>

      <div className="section-label"><Clock size={14} /> &nbsp;Operational hours</div>
      <div className="two-col">
        <div className="field">
          <label>Opening time</label>
          <input type="time" className="input" value={hours.openTime} onChange={(e) => setHours((h) => ({ ...h, openTime: e.target.value }))} />
        </div>
        <div className="field">
          <label>Closing time</label>
          <input type="time" className="input" value={hours.closeTime} onChange={(e) => setHours((h) => ({ ...h, closeTime: e.target.value }))} />
        </div>
      </div>
      {errors.time && <div className="field__error" style={{ marginTop: -6, marginBottom: 12 }}>{errors.time}</div>}

      <div className="field">
        <label>Open on</label>
        <div className="days-row">
          {DAYS.map((d) => (
            <button key={d.i} type="button" className={`day-toggle ${hours.days.includes(d.i) ? 'day-toggle--active' : ''}`} onClick={() => toggleDay(d.i)}>
              {d.label}
            </button>
          ))}
        </div>
        {errors.days && <div className="field__error" style={{ marginTop: 8 }}>{errors.days}</div>}
      </div>
    </StepShell>
  );
}

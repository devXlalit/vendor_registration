import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StepShell } from '../components/StepShell';
import { Button } from '../components/Button';
import { useRegistration } from '../context/RegistrationContext';
import { CATEGORIES } from '../data/catalog';
import type { CategoryId } from '../types';
import { Check } from '../components/Icons';

export function CategoryScreen() {
  const navigate = useNavigate();
  const { data, update } = useRegistration();
  const [selected, setSelected] = useState<CategoryId | null>(data.category);

  const submit = () => {
    if (!selected) return;
    update({ category: selected });
    navigate('/business');
  };

  return (
    <StepShell
      path="/category"
      back="/account"
      eyebrow="Your service"
      title="What would you like to sell on HATO?"
      subtitle="Choose the category that best fits your business. You can add more later from the partner app."
      footer={<Button onClick={submit} disabled={!selected}>Continue</Button>}
    >
      <div className="option-grid">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`option-card ${selected === c.id ? 'option-card--active' : ''}`}
            onClick={() => setSelected(c.id)}
          >
            <span className="option-card__check"><Check size={12} /></span>
            <span className="option-card__icon">{c.emoji}</span>
            <span className="option-card__label">{c.label}</span>
            <span className="option-card__desc">{c.desc}</span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

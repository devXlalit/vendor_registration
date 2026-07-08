import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
}

/** Segmented OTP input with paste, backspace and auto-advance handling. */
export function OtpInput({ length = 4, value, onChange }: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = value.padEnd(length).split('').slice(0, length);

  const setChar = (i: number, c: string) => {
    const next = chars.slice();
    next[i] = c;
    onChange(next.join('').replace(/\s/g, ''));
  };

  const handleInput = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    setChar(i, digit);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (chars[i].trim()) {
        setChar(i, '');
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        setChar(i - 1, '');
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (digits) {
      onChange(digits);
      refs.current[Math.min(digits.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="otp-row" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`otp-cell ${chars[i].trim() ? 'otp-cell--filled' : ''}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={chars[i].trim()}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

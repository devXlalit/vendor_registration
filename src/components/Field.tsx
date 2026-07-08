import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Info } from './Icons';

interface WrapProps {
  label?: ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

export function FieldWrap({ label, error, hint, optional, children }: WrapProps) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      {label && (
        <label>
          {label} {optional && <span className="optional">(optional)</span>}
        </label>
      )}
      {children}
      {error ? (
        <div className="field__error"><Info size={14} /> {error}</div>
      ) : hint ? (
        <div className="field__hint">{hint}</div>
      ) : null}
    </div>
  );
}

interface TextProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextField({ label, error, hint, optional, ...rest }: TextProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} optional={optional}>
      <input className="input" {...rest} />
    </FieldWrap>
  );
}

interface AreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
}

export function TextArea({ label, error, hint, optional, ...rest }: AreaProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} optional={optional}>
      <textarea className="textarea" {...rest} />
    </FieldWrap>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

export function SelectField({ label, error, hint, optional, children, ...rest }: SelectProps) {
  return (
    <FieldWrap label={label} error={error} hint={hint} optional={optional}>
      <select className="select-native" {...rest}>
        {children}
      </select>
    </FieldWrap>
  );
}

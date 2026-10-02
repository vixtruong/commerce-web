import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (id: string, description: string | undefined) => ReactNode;
}) {
  const id = useId();
  const description = error || hint ? id + '-description' : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children(id, description)}
      {(error || hint) && (
        <small
          id={description}
          className={error ? 'field-error' : 'muted'}
          role={error ? 'alert' : undefined}
        >
          {error || hint}
        </small>
      )}
    </div>
  );
}
export function Input({
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }) {
  return (
    <Field label={label} error={error} hint={hint}>
      {(id, description) => (
        <input id={id} aria-describedby={description} aria-invalid={!!error} {...props} />
      )}
    </Field>
  );
}

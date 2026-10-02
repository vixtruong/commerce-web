import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';
import { ApiError } from '../api/client';

/** Maps known server validation fields to accessible form errors, without trusting arbitrary field paths. */
export function applyServerErrors<T extends FieldValues>(
  error: Error,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
) {
  if (!(error instanceof ApiError) || !error.fields) return;
  for (const [name, messages] of Object.entries(error.fields)) {
    const field = fields.find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    if (field) setError(field, { type: 'server', message: messages.join(' ') });
  }
}

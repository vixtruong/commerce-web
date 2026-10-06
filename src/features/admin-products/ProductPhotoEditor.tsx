import { useState } from 'react';
import { Field } from '../../components/FormField';

/** Select photos locally; uploading and assigning them happens only when the product is saved. */
export function ProductPhotoEditor({
  photos,
  onAdd,
  onRemove,
  onPrimary,
  disabled,
}: {
  photos: string[];
  onAdd: (files: File[]) => void;
  onRemove: (photo: string) => void;
  onPrimary: (photo: string) => void;
  disabled: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <fieldset disabled={disabled}>
      <legend>Product photos</legend>
      <Field
        label="Add product photos"
        hint="JPEG, PNG or WebP. Up to 8 photos, 5 MB each. Photos are uploaded when you save."
        error={error || undefined}
      >
        {(id, description) => (
          <input
            id={id}
            aria-describedby={description}
            aria-invalid={!!error}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const files = Array.from(event.currentTarget.files || []);
              event.currentTarget.value = '';
              if (photos.length + files.length > 8) return setError('Choose up to eight photos.');
              if (
                files.some(
                  (file) =>
                    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                    file.size === 0 ||
                    file.size > 5 * 1024 * 1024,
                )
              )
                return setError('Choose JPEG, PNG or WebP photos up to 5 MB each.');
              setError(null);
              onAdd(files);
            }}
          />
        )}
      </Field>
      {photos.length ? (
        <ol className="photo-editor-list">
          {photos.map((photo, index) => (
            <li key={photo}>
              <img src={photo} alt={`Product preview ${index + 1}`} width="160" height="120" />
              <div className="actions">
                {index === 0 ? (
                  <span className="small">Primary photo</span>
                ) : (
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => onPrimary(photo)}
                    aria-label={`Make photo ${index + 1} primary`}
                  >
                    Make primary
                  </button>
                )}
                <button
                  className="text-link"
                  type="button"
                  onClick={() => {
                    setError(null);
                    onRemove(photo);
                  }}
                  aria-label={`Remove photo ${index + 1}`}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="small muted">No photos added.</p>
      )}
    </fieldset>
  );
}

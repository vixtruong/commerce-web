import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ProductPhotoEditor } from './ProductPhotoEditor';

it('selects multiple files and rejects unsupported files before uploading', async () => {
  const onAdd = vi.fn();
  render(
    <ProductPhotoEditor photos={[]} onAdd={onAdd} onRemove={vi.fn()} onPrimary={vi.fn()} disabled={false} />,
  );
  const input = screen.getByLabelText('Add product photos');
  const photos = [
    new File(['one'], 'one.png', { type: 'image/png' }),
    new File(['two'], 'two.jpg', { type: 'image/jpeg' }),
  ];
  await userEvent.upload(input, photos);
  expect(onAdd).toHaveBeenCalledWith(photos);
  await userEvent
    .setup({ applyAccept: false })
    .upload(input, new File(['<svg>'], 'unsafe.svg', { type: 'image/svg+xml' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Choose JPEG, PNG or WebP');
  expect(onAdd).toHaveBeenCalledTimes(1);
});

it('supports primary-photo selection and removal without changing the product until save', async () => {
  const primary = vi.fn();
  const remove = vi.fn();
  render(
    <ProductPhotoEditor
      photos={['/api/catalog/media/front.jpg', '/api/catalog/media/back.jpg']}
      onAdd={vi.fn()}
      onRemove={remove}
      onPrimary={primary}
      disabled={false}
    />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Make photo 2 primary' }));
  expect(primary).toHaveBeenCalledWith('/api/catalog/media/back.jpg');
  await userEvent.click(screen.getByRole('button', { name: 'Remove photo 1' }));
  expect(remove).toHaveBeenCalledWith('/api/catalog/media/front.jpg');
});

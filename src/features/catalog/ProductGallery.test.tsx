import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import type { Product } from './api';
import { ProductGallery } from './ProductGallery';

it('switches between real photos while keeping an accessible selected thumbnail', async () => {
  const product: Product = {
    id: '1',
    sku: 'TEST',
    name: 'Keyboard',
    description: '',
    priceAmount: 10,
    priceCurrency: 'USD',
    status: 'Active',
    createdAtUtc: '',
    updatedAtUtc: '',
    imageUrl: '/api/catalog/media/front.jpg',
    imageUrls: ['/api/catalog/media/front.jpg', '/api/catalog/media/back.jpg'],
  };
  render(<ProductGallery product={product} />);
  expect(screen.getByRole('img', { name: 'Keyboard' })).toHaveAttribute('src', product.imageUrl);
  const second = screen.getByRole('button', { name: 'View photo 2 of 2' });
  await userEvent.click(second);
  expect(second).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('img', { name: 'Keyboard' })).toHaveAttribute('src', product.imageUrls![1]);
});

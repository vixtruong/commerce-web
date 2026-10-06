import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ProductMedia } from './ProductMedia';

it('renders a Catalog photograph and explains a failed image', () => {
  render(
    <ProductMedia
      product={{
        name: 'USB-C Dock',
        sku: 'DEMO-DOCK',
        brand: 'UGREEN',
        imageUrl: '/api/catalog/media/demo-dock.jpg',
      }}
    />,
  );
  expect(screen.getByRole('img')).toHaveAttribute('src', '/api/catalog/media/demo-dock.jpg');
  expect(screen.getByText('Product photo · UGREEN')).toBeVisible();
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img')).toHaveAttribute('src', '/samples/product.svg');
  expect(screen.getByText('Image unavailable')).toBeVisible();
});

it('rejects third-party and traversal image paths', () => {
  const { rerender } = render(
    <ProductMedia product={{ name: 'Dock', sku: 'DOCK', imageUrl: 'https://example.com/image.jpg' }} />,
  );
  expect(screen.getByRole('img')).toHaveAttribute('src', '/samples/product.svg');
  rerender(
    <ProductMedia product={{ name: 'Dock', sku: 'DOCK', imageUrl: '/api/catalog/media/../secret.jpg' }} />,
  );
  expect(screen.getByRole('img')).toHaveAttribute('src', '/samples/product.svg');
});

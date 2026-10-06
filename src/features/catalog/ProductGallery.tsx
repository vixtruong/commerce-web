import { useState } from 'react';
import type { Product } from './api';
import { ProductMedia } from './ProductMedia';

/** Show ordered Catalog photos while retaining clear legacy and missing-photo fallbacks. */
export function ProductGallery({ product }: { product: Product }) {
  const photos = (
    product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : []
  ).filter((path) => /^\/api\/catalog\/media\/[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp|avif)$/.test(path));
  const [selected, setSelected] = useState<string | null>(null);
  const current = selected && photos.includes(selected) ? selected : photos[0];
  return (
    <>
      <div className="product-gallery">
        <ProductMedia product={{ ...product, imageUrl: current || product.imageUrl }} eager />
      </div>
      {photos.length > 1 && (
        <div className="product-thumbnails" aria-label="Product photos">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              aria-label={`View photo ${index + 1} of ${photos.length}`}
              aria-pressed={current === photo}
              onClick={() => setSelected(photo)}
            >
              <img
                src={photo}
                alt={`${product.name} — photo ${index + 1}`}
                width="80"
                height="60"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

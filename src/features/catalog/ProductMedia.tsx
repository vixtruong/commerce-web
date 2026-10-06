import { sampleMedia } from './sampleMedia';
import type { Product } from './api';
import { useState } from 'react';

/** Keep sample artwork and missing media explicit wherever a product is merchandised. */
export function ProductMedia({
  product,
  eager = false,
}: {
  product: Pick<Product, 'name' | 'sku' | 'imageUrl' | 'brand'>;
  eager?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  // Accept only Catalog-owned same-origin media. Invalid paths and failed photos have an explicit fallback.
  const photo =
    product.imageUrl &&
    /^\/api\/catalog\/media\/[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp|avif)$/.test(product.imageUrl) &&
    failedSource !== product.imageUrl
      ? product.imageUrl
      : null;
  const source = photo || (failedSource ? '/samples/product.svg' : sampleMedia(product.sku));
  const missing = source === '/samples/product.svg';
  return (
    <figure className="product-media">
      <img
        src={source}
        alt={
          missing
            ? product.name + ' — image unavailable'
            : photo
              ? product.name
              : product.name + ' — sample illustration'
        }
        onError={photo ? () => setFailedSource(photo) : undefined}
        loading={eager ? 'eager' : 'lazy'}
        width="640"
        height="480"
      />
      <figcaption className="media-caption">
        {missing
          ? 'Image unavailable'
          : photo
            ? 'Product photo' + (product.brand ? ' · ' + product.brand : '')
            : 'Sample illustration'}
      </figcaption>
    </figure>
  );
}

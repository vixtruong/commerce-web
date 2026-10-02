import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { productQuery, type Product } from './api';
import { sampleMedia } from './sampleMedia';
import { money } from '../../lib/format';
export function ProductCard({ product }: { product: Product }) {
  const client = useQueryClient();
  return (
    <article className="product-card">
      <Link
        to={'/products/' + product.id}
        onMouseEnter={() => void client.prefetchQuery(productQuery(product.id))}
        onFocus={() => void client.prefetchQuery(productQuery(product.id))}
      >
        <div className="product-image">
          <img
            src={sampleMedia(product.sku)}
            alt={product.name + ' — sample illustration'}
            loading="lazy"
            width="640"
            height="480"
          />
        </div>
        <div className="product-card-copy">
          <span className="eyebrow">{product.sku}</span>
          <h3>{product.name}</h3>
          <p>{money(product.priceAmount, product.priceCurrency)}</p>
          <span className="text-link">View product →</span>
        </div>
      </Link>
    </article>
  );
}

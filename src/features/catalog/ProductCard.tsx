import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { productQuery, type Product } from './api';
import { ProductMedia } from './ProductMedia';
import { money } from '../../lib/format';
import { ArrowUpRight } from 'lucide-react';
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
          <ProductMedia product={product} />
        </div>
        <div className="product-card-copy">
          <h3>{product.name}</h3>
          <span className="product-reference">{product.sku}</span>
          <div className="product-card-bottom">
            <p>{money(product.priceAmount, product.priceCurrency)}</p>
            <span className="product-card-arrow" aria-hidden="true">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <span className="product-card-action">
            View product <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}

import { messages } from '../../lib/messages';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productQuery, availabilityQuery } from './api';
import { ProductGallery } from './ProductGallery';
import { ShoppingBag } from 'lucide-react';
import { money } from '../../lib/format';
import { useUser } from '../../auth/useUser';
import { useCartMutation } from '../cart/api';
import { EmptyState, ErrorState, Skeleton } from '../../components/Feedback';
import { StockStatus } from '../../components/Status';
export default function ProductPage() {
  const { id = '' } = useParams();
  const product = useQuery(productQuery(id));
  const stock = useQuery(availabilityQuery(id));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const mutation = useCartMutation();
  const user = useUser();
  const navigate = useNavigate();
  if (product.isPending) return <Skeleton />;
  if (product.error) return <ErrorState error={product.error} retry={() => void product.refetch()} />;
  const p = product.data;
  if (p.status !== 'Active')
    return (
      <EmptyState
        title="This product is currently unavailable."
        description="Browse the collection for available products."
        action="/products"
        actionLabel={messages.browseProducts}
      />
    );
  const add = () => {
    if (!user.data) {
      navigate('/login', { state: { from: '/products/' + id } });
      return;
    }
    mutation.mutate({ productId: id, quantity, additive: true }, { onSuccess: () => setAdded(true) });
  };
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/products">Collection</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="product-detail">
        <div className="product-gallery-column">
          <ProductGallery product={p} />
        </div>
        <section className="product-info">
          <span className="eyebrow">{p.sku}</span>
          <h1>{p.name}</h1>
          <p className="product-price">{money(p.priceAmount, p.priceCurrency)}</p>
          {stock.data ? (
            <>
              <StockStatus available={stock.data.availableQuantity} />
              <p className="small muted">
                {stock.data.availableQuantity} units currently available. Availability is confirmed again at
                checkout.
              </p>
            </>
          ) : stock.error ? (
            <ErrorState error={stock.error} retry={() => void stock.refetch()} />
          ) : (
            <Skeleton rows={1} />
          )}
          <div className="purchase-row">
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max={Math.max(1, stock.data?.availableQuantity ?? 999)}
                value={quantity}
                onChange={(e) => {
                  setAdded(false);
                  setQuantity(Math.max(1, Math.trunc(Number(e.target.value)) || 1));
                }}
              />
            </label>
            <button
              className="button"
              onClick={add}
              disabled={mutation.isPending || !stock.data || stock.data.availableQuantity < quantity}
            >
              <ShoppingBag size={18} aria-hidden="true" /> {mutation.isPending ? 'Adding…' : 'Add to cart'}
            </button>
          </div>
          {added && (
            <p className="success-text" role="status">
              Item added to your cart.{' '}
              <Link to="/cart" className="text-link">
                View cart →
              </Link>
            </p>
          )}
          {mutation.error && <ErrorState error={mutation.error} />}
          <p className="purchase-note">
            Review your selection in the cart before checkout. Final prices and availability are confirmed
            when you place your order.
          </p>
        </section>
        <section className="product-description" aria-labelledby="product-details-heading">
          <p className="eyebrow">The details</p>
          <h2 id="product-details-heading">Made for your everyday.</h2>
          <p>{p.description || 'No additional product description is available.'}</p>
          <dl className="detail-facts">
            {p.brand && (
              <div>
                <dt>Brand</dt>
                <dd>{p.brand}</dd>
              </div>
            )}
            {p.categorySlug && (
              <div>
                <dt>Collection</dt>
                <dd>
                  <Link to={'/products?category=' + p.categorySlug}>
                    {p.categorySlug.replaceAll('-', ' ')}
                  </Link>
                </dd>
              </div>
            )}
            <div>
              <dt>Product reference</dt>
              <dd>{p.sku}</dd>
            </div>
            <div>
              <dt>Currency</dt>
              <dd>{p.priceCurrency}</dd>
            </div>
            <div>
              <dt>Order updates</dt>
              <dd>Track processing and fulfilment in your account.</dd>
            </div>
          </dl>
          {p.sourceUrl && (
            <p className="small">
              <a className="text-link" href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                Manufacturer product reference ↗
              </a>
            </p>
          )}
        </section>
      </div>
    </>
  );
}

import { messages } from '../../lib/messages';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productQuery, availabilityQuery } from './api';
import { sampleMedia } from './sampleMedia';
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
      <nav className="breadcrumb">
        <Link to="/products">Collection</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="product-detail">
        <div>
          <div className="product-gallery">
            <img src={sampleMedia(p.sku)} alt={p.name + ' sample illustration'} width="640" height="480" />
          </div>
          <p className="muted small">Sample product illustration.</p>
        </div>
        <section className="product-info">
          <span className="eyebrow">{p.sku}</span>
          <h1>{p.name}</h1>
          <p className="product-price">{money(p.priceAmount, p.priceCurrency)}</p>
          <p>{p.description}</p>
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
              {mutation.isPending ? 'Adding…' : 'Add to cart'}
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
          <dl className="detail-facts">
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
        </section>
      </div>
    </>
  );
}

import { messages } from '../../lib/messages';
import { Link } from 'react-router-dom';
import { useCart, useCartMutation, type CartItem as CartItemType } from './api';
import { ProductMedia } from '../catalog/ProductMedia';
import { cartTotals, money } from '../../lib/format';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { CheckoutSteps } from '../../components/CheckoutSteps';
import { useQuery } from '@tanstack/react-query';
import { productQuery } from '../catalog/api';
export function CartItem({
  item,
  pending,
  onChange,
}: {
  item: CartItemType;
  pending: boolean;
  onChange: (quantity: number) => void;
}) {
  // Cart snapshots retain checkout data; current Catalog metadata supplies photos even for previously saved carts.
  const product = useQuery(productQuery(item.productId));
  return (
    <article className="cart-item">
      <div className="cart-media">
        <ProductMedia
          product={{
            name: item.productName,
            sku: item.sku,
            imageUrl: product.data?.imageUrl,
            brand: product.data?.brand,
          }}
          eager
        />
      </div>
      <div>
        <Link className="item-title" to={'/products/' + item.productId}>
          {item.productName}
        </Link>
        <p className="muted small">{item.sku}</p>
        <p>{money(item.unitPrice, item.currency)} each</p>
        <div className="cart-item-actions">
          <label>
            Quantity{' '}
            <input
              aria-label={'Quantity for ' + item.productName}
              type="number"
              min="1"
              value={item.quantity}
              disabled={pending}
              onChange={(e) => {
                const quantity = Number(e.target.value);
                if (Number.isInteger(quantity) && quantity > 0) onChange(quantity);
              }}
            />
          </label>
          <button className="text-link" disabled={pending} onClick={() => onChange(0)}>
            Remove
          </button>
        </div>
      </div>
      <strong>{money((Math.round(item.unitPrice * 100) * item.quantity) / 100, item.currency)}</strong>
    </article>
  );
}
export default function CartPage() {
  const cart = useCart();
  const mutation = useCartMutation();
  if (cart.isPending) return <Skeleton />;
  if (cart.error) return <ErrorState error={cart.error} retry={() => void cart.refetch()} />;
  if (!cart.data.items.length)
    return (
      <EmptyState
        title={messages.cartEmpty}
        description="Find something for your everyday workspace."
        action="/products"
        actionLabel="Explore the collection"
      />
    );
  return (
    <>
      <PageHeader
        eyebrow={messages.yourSelection}
        title="Shopping cart"
        description={`${cart.data.items.length} ${cart.data.items.length === 1 ? 'product' : 'products'} in your cart`}
      />
      <CheckoutSteps current={0} />
      <div className="commerce-columns">
        <div>
          {cart.data.items.map((item) => (
            <CartItem
              key={item.productId}
              item={item}
              pending={mutation.isPending}
              onChange={(quantity) => mutation.mutate({ productId: item.productId, quantity })}
            />
          ))}
          {mutation.error && <ErrorState error={mutation.error} />}
        </div>
        <aside className="order-summary">
          <h2>Order estimate</h2>
          {cartTotals(cart.data.items).map((total) => (
            <div className="summary-line" key={total.currency}>
              <span>Subtotal ({total.currency})</span>
              <strong>{money(total.amount, total.currency)}</strong>
            </div>
          ))}
          <p className="small muted">
            Current prices and stock will be checked when you place your order. The accepted order total is
            authoritative.
          </p>
          {mutation.isPending ? (
            <button className="button full" disabled>
              Updating cart…
            </button>
          ) : (
            <Link className="button full" to="/checkout">
              Continue to checkout →
            </Link>
          )}
          <Link className="text-link" to="/products">
            Continue browsing
          </Link>
        </aside>
      </div>
    </>
  );
}

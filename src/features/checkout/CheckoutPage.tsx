import { messages } from '../../lib/messages';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../../api/client';
import { useUser } from '../../auth/useUser';
import { useCart } from '../cart/api';
import { checkoutSchema, type CheckoutAddress } from './schema';
import { checkoutAttempt, loadAttempt, saveAttempt, clearAttempt } from './attempt';
import { cartTotals, money } from '../../lib/format';
import { applyServerErrors } from '../../lib/formErrors';
import { Input } from '../../components/FormField';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { CheckoutSteps } from '../../components/CheckoutSteps';
interface AcceptedOrder {
  orderId: string;
  orderNumber: string;
  status: string;
}
export default function CheckoutPage() {
  const cart = useCart();
  const user = useUser();
  const navigate = useNavigate();
  const submitting = useRef(false);
  const attempt = loadAttempt(user.data?.id || '');
  const form = useForm<CheckoutAddress>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: attempt?.payload ?? { countryCode: 'VN' },
  });
  const mutation = useMutation({
    mutationFn: (address: CheckoutAddress) => {
      const stable = checkoutAttempt(user.data!.id, address, JSON.stringify(cart.data?.items ?? []));
      return api<AcceptedOrder>('/api/orders/checkout', {
        method: 'POST',
        body: stable.payload,
        headers: { 'Idempotency-Key': stable.key },
      });
    },
    onSuccess: (accepted) => {
      const stable = loadAttempt(user.data!.id)!;
      saveAttempt({ ...stable, orderId: accepted.orderId });
      navigate('/checkout/processing/' + accepted.orderId, { replace: true });
    },
    onSettled: () => {
      submitting.current = false;
    },
    onError: (error) => {
      applyServerErrors(error, form.setError, [
        'recipientName',
        'addressLine1',
        'city',
        'postalCode',
        'countryCode',
      ]);
      // A definitive validation rejection has not accepted an order; allow correcting this attempt.
      if (error instanceof ApiError && error.status === 400) clearAttempt();
    },
  });
  if (attempt?.orderId) return <Navigate to={'/checkout/processing/' + attempt.orderId} replace />;
  if (cart.isPending) return <Skeleton />;
  if (cart.error) return <ErrorState error={cart.error} retry={() => void cart.refetch()} />;
  if (!cart.data.items.length && !attempt)
    return (
      <EmptyState
        title={messages.cartEmpty}
        description={messages.addBeforeCheckout}
        action="/products"
        actionLabel={messages.browseProducts}
      />
    );
  return (
    <>
      <PageHeader
        eyebrow={messages.checkoutEyebrow}
        title={messages.checkoutTitle}
        description={messages.checkoutDescription}
      />
      <CheckoutSteps current={1} />
      <div className="commerce-columns checkout-columns">
        <form
          className="checkout-form"
          onSubmit={form.handleSubmit((address) => {
            if (!submitting.current) {
              submitting.current = true;
              mutation.mutate(address);
            }
          })}
          noValidate
        >
          <fieldset disabled={mutation.isPending || !!attempt}>
            <legend>{messages.deliveryLegend}</legend>
            <Input
              label={messages.recipientName}
              autoComplete="shipping name"
              required
              {...form.register('recipientName')}
              error={form.formState.errors.recipientName?.message}
            />
            <Input
              label={messages.streetAddress}
              autoComplete="shipping address-line1"
              required
              {...form.register('addressLine1')}
              error={form.formState.errors.addressLine1?.message}
            />
            <div className="form-row">
              <Input
                label={messages.city}
                autoComplete="shipping address-level2"
                required
                {...form.register('city')}
                error={form.formState.errors.city?.message}
              />
              <Input
                label={messages.postalCode}
                autoComplete="shipping postal-code"
                required
                {...form.register('postalCode')}
                error={form.formState.errors.postalCode?.message}
              />
            </div>
            <Input
              label={messages.countryCode}
              autoComplete="shipping country"
              required
              maxLength={2}
              {...form.register('countryCode')}
              error={form.formState.errors.countryCode?.message}
            />
          </fieldset>
          <section className="checkout-payment">
            <h2>{messages.paymentLegend}</h2>
            <p>{messages.paymentDisclosure}</p>
          </section>
          {mutation.error && <ErrorState error={mutation.error} />}
          {attempt && !attempt.orderId && (
            <p role="status" className="notice">
              {messages.attemptSaved}
            </p>
          )}
          <div className="actions">
            <button className="button" type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? messages.submitting
                : attempt
                  ? messages.retryCheckout
                  : messages.placeOrder}
            </button>
            <Link className="text-link" to="/orders">
              {messages.orderHistory}
            </Link>
          </div>
        </form>
        <aside className="order-summary checkout-review">
          <details className="order-review-disclosure" open>
            <summary>
              {messages.yourSelection}
              <span>
                {cart.data.items.length} {cart.data.items.length === 1 ? 'item' : 'items'}
              </span>
            </summary>
            <div className="order-review-content">
              {cart.data.items.map((i) => (
                <div key={i.productId} className="summary-line">
                  <span>
                    {i.productName} × {i.quantity}
                  </span>
                  <span>{money((Math.round(i.unitPrice * 100) * i.quantity) / 100, i.currency)}</span>
                </div>
              ))}
              {cartTotals(cart.data.items).map((t) => (
                <div key={t.currency} className="summary-line total">
                  <span>{messages.estimatedTotal}</span>
                  <strong>{money(t.amount, t.currency)}</strong>
                </div>
              ))}
              <p className="small muted">{messages.verifyPrices}</p>
              <Link to="/cart" className="text-link">
                {messages.returnToCart}
              </Link>
            </div>
          </details>
        </aside>
      </div>
    </>
  );
}

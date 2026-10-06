import { messages } from '../../lib/messages';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { orderQuery, isCheckoutTerminal, checkoutFailure } from '../orders/api';
import { clearAttempt } from './attempt';
import { ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { money } from '../../lib/format';
import { CheckoutSteps } from '../../components/CheckoutSteps';
const stages = [
  messages.orderReceived,
  messages.checkingAvailability,
  messages.processingPayment,
  messages.preparingShipment,
];
export default function ProcessingPage({ success = false }: { success?: boolean }) {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [started, setStarted] = useState(Date.now);
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), 120_000);
    return () => window.clearTimeout(timer);
  }, [started]);
  const order = useQuery({
    ...orderQuery(orderId),
    refetchInterval: (query) =>
      timedOut || query.state.error || (query.state.data && isCheckoutTerminal(query.state.data))
        ? false
        : 2000,
  });
  useEffect(() => {
    if (!success && order.data && ['Shipped', 'Delivered'].includes(order.data.status))
      navigate('/checkout/success/' + orderId, { replace: true });
  }, [order.data, orderId, navigate, success]);
  const finish = useMutation({
    mutationFn: () => api<void>('/api/cart', { method: 'DELETE' }),
    onSuccess: () => {
      clearAttempt();
      void client.invalidateQueries({ queryKey: ['cart'] });
      navigate('/products');
    },
  });
  if (order.isPending) return <Skeleton />;
  if (order.error)
    return (
      <ErrorState
        error={order.error}
        retry={() => {
          setTimedOut(false);
          setStarted(Date.now());
          void order.refetch();
        }}
      />
    );
  const o = order.data;
  const cancelled = o.status === 'Cancelled';
  const completed = ['Shipped', 'Delivered'].includes(o.status);
  const current = ['Paid', 'Processing'].includes(o.status)
    ? 3
    : o.status === 'AwaitingPayment' || o.status === 'InventoryReserved'
      ? 2
      : 1;
  return (
    <section className="processing-page">
      <CheckoutSteps current={2} />
      <PageHeader
        eyebrow={o.orderNumber}
        title={
          cancelled ? messages.cancelledOrder : completed ? messages.confirmedOrder : messages.confirmingOrder
        }
        description={
          cancelled
            ? checkoutFailure(o)
            : completed
              ? messages.paymentAndShipmentConfirmed
              : messages.returnToOrder
        }
      />
      {!cancelled && (
        <ol className="checkout-stages" aria-label={messages.checkoutProgress}>
          {stages.map((stage, index) => (
            <li
              key={stage}
              className={completed || index < current ? 'complete' : index === current ? 'current' : ''}
            >
              <span>{completed || index < current ? '✓' : index + 1}</span>
              <strong>{stage}</strong>
              {!completed && index === current && <small>{messages.inProgress}</small>}
            </li>
          ))}
        </ol>
      )}
      <div className="processing-summary">
        <strong>{money(o.totalAmount, o.currency)}</strong>
        <span>{o.items.reduce((sum, i) => sum + i.quantity, 0)} items</span>
        {o.trackingNumber && <span>Tracking reference: {o.trackingNumber}</span>}
      </div>
      {timedOut && !isCheckoutTerminal(o) && (
        <div role="status" className="notice">
          <p>{messages.orderDelayed}</p>
          <button
            className="button secondary"
            onClick={() => {
              setTimedOut(false);
              setStarted(Date.now());
              void order.refetch();
            }}
          >
            {messages.resumeUpdates}
          </button>
        </div>
      )}
      <div className="actions">
        <Link className="button secondary" to={'/orders/' + orderId}>
          {messages.viewOrder}
        </Link>
        {completed && (
          <button className="button" disabled={finish.isPending} onClick={() => finish.mutate()}>
            {messages.finishCheckout}
          </button>
        )}
        {cancelled && (
          <Link className="button" to="/cart" onClick={clearAttempt}>
            {messages.reviewCart}
          </Link>
        )}
      </div>
      {finish.error && <ErrorState error={finish.error} />}
    </section>
  );
}

import { messages } from '../../lib/messages';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderQuery, checkoutFailure, orderPaymentLabel } from './api';
import { OrderTimeline } from './OrderTimeline';
import { date, money } from '../../lib/format';
import { ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { Status } from '../../components/Status';
export default function OrderDetailPage({ admin = false }: { admin?: boolean }) {
  const { orderId = '' } = useParams();
  const order = useQuery(orderQuery(orderId, admin));
  if (order.isPending) return <Skeleton />;
  if (order.error) return <ErrorState error={order.error} retry={() => void order.refetch()} />;
  const o = order.data;
  return (
    <>
      <PageHeader
        eyebrow={admin ? 'Sales / Order detail' : 'Your orders'}
        title={o.orderNumber}
        description={'Placed ' + date(o.createdAtUtc)}
        action={
          <button
            className="button secondary"
            disabled={order.isFetching}
            onClick={() => void order.refetch()}
          >
            {messages.refreshStatus}
          </button>
        }
      />
      <div className="commerce-columns">
        <div>
          <Status kind="order" value={o.status} />
          {o.status === 'Cancelled' && <p className="notice">{checkoutFailure(o)}</p>}
          <div className="order-lines">
            {o.items.map((i) => (
              <div className="order-line" key={i.productId}>
                <div>
                  <strong>{i.productName}</strong>
                  <p className="small muted">
                    {i.sku} · Quantity {i.quantity}
                  </p>
                  <p>{money(i.unitPrice, i.currency)} each</p>
                </div>
                <span>{money((Math.round(i.unitPrice * 100) * i.quantity) / 100, i.currency)}</span>
              </div>
            ))}
          </div>
          <div className="summary-line total">
            <strong>Order total</strong>
            <strong>{money(o.totalAmount, o.currency)}</strong>
          </div>
          <OrderTimeline order={o} />
        </div>
        <aside className="order-summary">
          <h2>{messages.deliveryDetails}</h2>
          {o.shippingAddress && (
            <address>
              {o.shippingAddress.recipientName}
              <br />
              {o.shippingAddress.line1}
              <br />
              {o.shippingAddress.city}, {o.shippingAddress.postalCode}
              <br />
              {o.shippingAddress.countryCode}
            </address>
          )}
          <hr />
          <h3>Payment</h3>
          <p>{orderPaymentLabel(o)}</p>
          <p className="small muted">{messages.paymentBasedOnOrder}</p>
          <h3>Fulfilment</h3>
          <p>
            {o.trackingNumber
              ? 'Shipment created · ' + o.trackingNumber
              : ['Shipped', 'Delivered'].includes(o.status)
                ? 'Shipment recorded; the tracking reference is unavailable for this order.'
                : messages.noShipment}
          </p>
          {admin && (
            <>
              <h3>Operational references</h3>
              <p className="mono break-word">{o.id}</p>
              <p>
                Customer: <span className="mono break-word">{o.customerId}</span>
              </p>
              <p>Workflow: {o.sagaStatus}</p>
            </>
          )}
        </aside>
      </div>
    </>
  );
}

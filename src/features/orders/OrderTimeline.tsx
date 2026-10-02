import { messages } from '../../lib/messages';
import type { Order } from './api';
import { date } from '../../lib/format';
import { Status } from '../../components/Status';
export function OrderTimeline({ order }: { order: Order }) {
  return (
    <section className="order-timeline">
      <h2>{messages.orderActivity}</h2>
      <ol>
        <li>
          <span className="timeline-dot" />
          <div>
            <strong>Order created</strong>
            <time dateTime={order.createdAtUtc}>{date(order.createdAtUtc)}</time>
          </div>
        </li>
        <li>
          <span className="timeline-dot" />
          <div>
            <Status kind="order" value={order.status} />
            <time dateTime={order.updatedAtUtc}>{date(order.updatedAtUtc)}</time>
            {order.trackingNumber && <p>Tracking reference: {order.trackingNumber}</p>}
          </div>
        </li>
      </ol>
      <p className="small muted">Showing the creation time and latest persisted transition.</p>
    </section>
  );
}

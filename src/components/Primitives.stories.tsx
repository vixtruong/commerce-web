import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Input } from './FormField';
import { Status, StockStatus } from './Status';
import { EmptyState, Skeleton } from './Feedback';
import { ConfirmDialog } from './ConfirmDialog';
function Primitives() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ maxWidth: 700 }}>
      <h1>Commerce primitives</h1>
      <div className="actions">
        <button className="button">Primary button</button>
        <button className="button secondary">Secondary button</button>
      </div>
      <hr />
      <Input label="Product name" placeholder="Mechanical keyboard" />
      <Input label="Recipient name" error="Enter the recipient name." aria-invalid="true" />
      <label>
        Publication
        <select defaultValue="Active">
          <option>Active</option>
          <option>Draft</option>
        </select>
      </label>
      <hr />
      <div className="actions">
        <Status kind="order" value="AwaitingPayment" />
        <Status kind="payment" value="Failed" />
        <Status kind="shipment" value="InTransit" />
        <StockStatus available={3} />
      </div>
      <hr />
      <button className="button secondary" onClick={() => setOpen(true)}>
        Open confirmation
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirm adjustment"
        description="Receive five units with an audit reason."
        onConfirm={() => setOpen(false)}
      />
      <EmptyState
        title="Your cart is empty."
        description="Find an everyday essential."
        action="/products"
        actionLabel="Browse products"
      />
      <Skeleton rows={2} />
    </div>
  );
}
const meta = { title: 'Design system/Primitives', component: Primitives } satisfies Meta<typeof Primitives>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};

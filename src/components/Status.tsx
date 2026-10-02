import { statusFor, stockState } from '../lib/status';
export function Status({
  kind,
  value,
}: {
  kind: 'order' | 'payment' | 'shipment' | 'product';
  value: string;
}) {
  const state = statusFor(kind, value);
  return (
    <span className={'status ' + state.tone}>
      <span aria-hidden="true">●</span> {state.label}
    </span>
  );
}
export function StockStatus({ available, reserved = 0 }: { available: number; reserved?: number }) {
  const state = stockState(available, reserved);
  return (
    <span className={'status ' + state.tone}>
      <span aria-hidden="true">●</span> {state.label}
    </span>
  );
}

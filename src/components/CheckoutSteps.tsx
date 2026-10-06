import { Check } from 'lucide-react';

const steps = ['Your cart', 'Delivery details', 'Order confirmation'];

/** Location within checkout; fulfilment progress remains owned by the Saga view. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <ol className="checkout-navigation" aria-label="Checkout steps">
      {steps.map((step, index) => (
        <li
          key={step}
          className={index < current ? 'complete' : index === current ? 'current' : ''}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="step-number" aria-hidden="true">
            {index < current ? <Check size={16} /> : String(index + 1).padStart(2, '0')}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

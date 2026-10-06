import type { Meta, StoryObj } from '@storybook/react-vite';
import { Brand } from './Brand';
import { CheckoutSteps } from './CheckoutSteps';
import { EmptyState, ErrorState, Skeleton } from './Feedback';

function DesignSystem() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Brand workspace />
      <hr />
      <p className="eyebrow">SkillNest-inspired Commerce workspace</p>
      <h1>Calm surfaces. Clear actions.</h1>
      <p className="muted">
        Bold product headings, monospace metadata, mint surfaces and 4–8px corners share semantic tokens.
      </p>
      <div className="actions">
        {['surface', 'canvas', 'primary-soft', 'primary', 'primary-deep'].map((token) => (
          <div key={token} style={{ width: 145 }}>
            <div
              style={{
                height: 65,
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                background: `var(--${token})`,
              }}
            />
            <p className="small mono">{token}</p>
          </div>
        ))}
      </div>
      <hr />
      <CheckoutSteps current={1} />
      <ErrorState error={new Error('The collection is temporarily unavailable.')} retry={() => undefined} />
      <EmptyState title="Nothing here yet." description="Available products appear here when published." />
      <Skeleton rows={3} variant="products" />
    </div>
  );
}
const meta = { title: 'Design system/Workspace identity', component: DesignSystem } satisfies Meta<
  typeof DesignSystem
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCard } from './ProductCard';
const meta = { title: 'Commerce/Product card', component: ProductCard } satisfies Meta<typeof ProductCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Sample: Story = {
  args: {
    product: {
      id: 'sample',
      sku: 'KEYBOARD-001',
      name: 'Mechanical Keyboard',
      description: 'Storybook sample only',
      priceAmount: 120,
      priceCurrency: 'USD',
      status: 'Active',
      createdAtUtc: '',
      updatedAtUtc: '',
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable } from './DataTable';
function SampleTable() {
  return (
    <DataTable
      caption="Sample stock table"
      data={[
        { sku: 'SAMPLE-1', onHand: 10, reserved: 2, available: 8 },
        { sku: 'SAMPLE-2', onHand: 4, reserved: 4, available: 0 },
      ]}
      columns={[
        { accessorKey: 'sku', header: 'SKU' },
        { accessorKey: 'onHand', header: 'On hand' },
        { accessorKey: 'reserved', header: 'Reserved' },
        { accessorKey: 'available', header: 'Available' },
      ]}
    />
  );
}
const meta = { title: 'Operations/Data table', component: SampleTable } satisfies Meta<typeof SampleTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};

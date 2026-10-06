import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductPhotoEditor } from './ProductPhotoEditor';
const meta = { title: 'Commerce/Product photo editor', component: ProductPhotoEditor } satisfies Meta<
  typeof ProductPhotoEditor
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {
  args: { photos: [], disabled: false, onAdd: () => {}, onRemove: () => {}, onPrimary: () => {} },
};
export const Existing: Story = {
  args: { ...Empty.args, photos: ['/samples/keyboard.svg', '/samples/macbook.svg'] },
};

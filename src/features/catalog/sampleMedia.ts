// Explicit development illustrations are isolated from Catalog data; no media-upload capability is implied.
export function sampleMedia(sku: string) {
  return sku === 'MACBOOK-PRO-001'
    ? '/samples/laptop.svg'
    : sku === 'KEYBOARD-001'
      ? '/samples/keyboard.svg'
      : '/samples/product.svg';
}

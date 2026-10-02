import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, hasSession, sessionGeneration } from '../../api/client';
export interface CartItem {
  productId: string;
  sku: string;
  productName: string;
  unitPrice: number;
  currency: string;
  quantity: number;
}
export interface Cart {
  customerId: string;
  items: CartItem[];
  updatedAtUtc: string;
}
export const cartKey = ['cart'] as const;
export function useCart() {
  return useQuery({
    queryKey: cartKey,
    queryFn: ({ signal }) => api<Cart>('/api/cart', { signal }),
    staleTime: 5000,
  });
}
export function useCartMutation() {
  const client = useQueryClient();
  return useMutation({
    scope: { id: 'cart-write' },
    mutationFn: async ({
      productId,
      quantity,
      additive,
    }: {
      productId: string;
      quantity: number;
      additive?: boolean;
    }) => {
      if (additive) {
        const current = await api<Cart>('/api/cart');
        quantity += current.items.find((i) => i.productId === productId)?.quantity ?? 0;
      }
      return api<Cart>(
        '/api/cart/items/' + productId,
        quantity === 0 ? { method: 'DELETE' } : { method: 'PUT', body: { quantity } },
      );
    },
    onMutate: async ({ productId, quantity, additive }) => {
      const generation = sessionGeneration();
      await client.cancelQueries({ queryKey: cartKey });
      const previous = client.getQueryData<Cart>(cartKey);
      if (previous)
        client.setQueryData<Cart>(cartKey, {
          ...previous,
          items:
            quantity === 0
              ? previous.items.filter((i) => i.productId !== productId)
              : previous.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity: additive ? i.quantity + quantity : quantity }
                    : i,
                ),
        });
      return { previous, generation };
    },
    onError: (_error, _variables, context) => {
      if (hasSession() && context?.generation === sessionGeneration() && context.previous)
        client.setQueryData(cartKey, context.previous);
    },
    onSuccess: (cart, _variables, context) => {
      if (context?.generation === sessionGeneration()) client.setQueryData(cartKey, cart);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: cartKey });
    },
  });
}

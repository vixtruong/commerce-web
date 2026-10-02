import { messages } from '../../lib/messages';
import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../api/client';
import { productQuery } from '../catalog/api';
import { productSchema, type ProductInput } from './schema';
import { Input, Field } from '../../components/FormField';
import { ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Status } from '../../components/Status';
import { Can } from '../../auth/Guards';
import { Permissions } from '../../auth/permissions';
import { applyServerErrors } from '../../lib/formErrors';
export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const saved = useRef(false);
  const product = useQuery({ ...productQuery(id || ''), enabled: !!id });
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { sku: '', name: '', description: '', priceAmount: 0, priceCurrency: 'USD' },
  });
  const [deactivate, setDeactivate] = useState(false);
  useEffect(() => {
    if (product.data) form.reset(product.data);
  }, [product.data, form]);
  const dirty = form.formState.isDirty;
  const blocker = useBlocker(() => dirty && !saved.current);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const mutation = useMutation<void | { productId: string }, Error, ProductInput>({
    mutationFn: (body: ProductInput) =>
      id
        ? api<void>('/api/catalog/products/' + id, { method: 'PUT', body })
        : api<{ productId: string }>('/api/catalog/products', { method: 'POST', body }),
    onSuccess: () => {
      saved.current = true;
      void client.invalidateQueries({ queryKey: ['catalog'] });
      navigate('/admin/products');
    },
    onError: (error) =>
      applyServerErrors(error, form.setError, ['sku', 'name', 'description', 'priceAmount', 'priceCurrency']),
  });
  const publication = useMutation({
    mutationFn: (active: boolean) =>
      api<void>('/api/catalog/products/' + id + (active ? '/activate' : '/deactivate'), { method: 'POST' }),
    onSuccess: () => {
      setDeactivate(false);
      void client.invalidateQueries({ queryKey: ['catalog'] });
    },
  });
  if (id && product.isPending) return <Skeleton />;
  if (product.error) return <ErrorState error={product.error} retry={() => void product.refetch()} />;
  return (
    <>
      <PageHeader
        eyebrow="Commerce / Products"
        title={id ? 'Edit product' : 'Create product'}
        description="Catalog is authoritative for product content and price."
      />
      <div className="admin-form-layout">
        <form onSubmit={form.handleSubmit((body) => mutation.mutate(body))} noValidate>
          <fieldset disabled={mutation.isPending}>
            <legend>Product information</legend>
            <Input
              label="SKU"
              required
              readOnly={!!id}
              {...form.register('sku')}
              error={form.formState.errors.sku?.message}
              hint={id ? 'SKU remains stable after creation.' : undefined}
            />
            <Input
              label="Product name"
              required
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />
            <Field label="Description" error={form.formState.errors.description?.message}>
              {(fieldId, description) => (
                <textarea
                  id={fieldId}
                  aria-describedby={description}
                  rows={5}
                  {...form.register('description')}
                />
              )}
            </Field>
            <div className="form-row">
              <Input
                label="Price amount"
                type="number"
                min="0"
                step="0.01"
                required
                {...form.register('priceAmount', { valueAsNumber: true })}
                error={form.formState.errors.priceAmount?.message}
              />
              <Input
                label="Currency"
                maxLength={3}
                required
                {...form.register('priceCurrency')}
                error={form.formState.errors.priceCurrency?.message}
              />
            </div>
          </fieldset>
          {mutation.error && <ErrorState error={mutation.error} />}
          <div className="actions">
            <button className="button" disabled={mutation.isPending} type="submit">
              {mutation.isPending ? messages.saving : 'Save product'}
            </button>
            <Link className="text-link" to="/admin/products">
              {messages.cancel}
            </Link>
          </div>
        </form>
        <aside className="info-panel">
          <h2>Publication</h2>
          {product.data ? (
            <>
              <Status kind="product" value={product.data.status} />
              <p>Publication controls whether checkout can purchase this product.</p>
              {product.data.status === 'Active' ? (
                <Can permission={Permissions.ProductDeactivate}>
                  <button
                    className="button secondary"
                    disabled={publication.isPending}
                    onClick={() => setDeactivate(true)}
                  >
                    Deactivate product
                  </button>
                </Can>
              ) : (
                <Can permission={Permissions.ProductUpdate}>
                  <button
                    className="button"
                    disabled={publication.isPending}
                    onClick={() => publication.mutate(true)}
                  >
                    Activate product
                  </button>
                </Can>
              )}
              <Can permission={Permissions.InventoryRead}>
                <p>
                  <Link to={'/admin/inventory/' + id} className="text-link">
                    Manage stock →
                  </Link>
                </p>
              </Can>
            </>
          ) : (
            <p>New products are saved as drafts. Activate the product and receive stock before selling.</p>
          )}
          {publication.error && <ErrorState error={publication.error} />}
          <hr />
          <h3>Product media</h3>
          <p className="small muted">
            Local development illustrations are displayed for seed products. Uploads are not implemented.
          </p>
        </aside>
      </div>
      <ConfirmDialog
        open={deactivate}
        onOpenChange={setDeactivate}
        title="Deactivate this product?"
        description="New checkout attempts will no longer accept this product. Historical orders are retained."
        pending={publication.isPending}
        error={publication.error}
        onConfirm={() => publication.mutate(false)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
        title="Discard unsaved changes?"
        description="Your changes have not been saved."
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
    </>
  );
}

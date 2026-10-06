import { messages } from '../../lib/messages';
import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../api/client';
import { productQuery, categoriesQuery } from '../catalog/api';
import { productSchema, type ProductInput } from './schema';
import { Input, Field } from '../../components/FormField';
import { ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Status } from '../../components/Status';
import { Can } from '../../auth/Guards';
import { Permissions } from '../../auth/permissions';
import { hasPermission } from '../../auth/permissions';
import { useUser } from '../../auth/useUser';
import { applyServerErrors } from '../../lib/formErrors';
import { ProductPhotoEditor } from './ProductPhotoEditor';
export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const saved = useRef(false);
  const pendingPhotos = useRef(new Map<string, File>());
  const uploadedPhotos = useRef(new Map<string, string>());
  useEffect(
    () => () => {
      for (const preview of pendingPhotos.current.keys()) URL.revokeObjectURL(preview);
    },
    [],
  );
  const product = useQuery({ ...productQuery(id || ''), enabled: !!id });
  const user = useUser();
  const canManageCollections = hasPermission(user.data, Permissions.ProductUpdate);
  const categories = useQuery(categoriesQuery(canManageCollections));
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      description: '',
      priceAmount: 0,
      priceCurrency: 'USD',
      brand: '',
      categorySlug: '',
      imageUrls: [],
    },
  });
  const [deactivate, setDeactivate] = useState(false);
  useEffect(() => {
    if (product.data)
      form.reset({
        ...product.data,
        brand: product.data.brand || '',
        categorySlug: product.data.categorySlug || '',
        imageUrls: product.data.imageUrls?.length
          ? product.data.imageUrls
          : product.data.imageUrl
            ? [product.data.imageUrl]
            : [],
      });
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
    mutationFn: async (body: ProductInput) => {
      const imageUrls: string[] = [];
      for (const photo of body.imageUrls) {
        const file = pendingPhotos.current.get(photo);
        let stored = uploadedPhotos.current.get(photo);
        if (file && !stored) {
          const multipart = new FormData();
          multipart.append('file', file);
          const uploaded = await api<{ imageUrl: string }>('/api/catalog/images', {
            method: 'POST',
            body: multipart,
          });
          stored = uploaded.imageUrl;
          uploadedPhotos.current.set(photo, stored);
        }
        imageUrls.push(stored || photo);
      }
      // Identical uploads share a checksum path and should appear only once in the product gallery.
      const request = { ...body, imageUrls: Array.from(new Set(imageUrls)) };
      return id
        ? api<void>('/api/catalog/products/' + id, { method: 'PUT', body: request })
        : api<{ productId: string }>('/api/catalog/products', { method: 'POST', body: request });
    },
    onSuccess: () => {
      saved.current = true;
      void client.invalidateQueries({ queryKey: ['catalog'] });
      navigate('/admin/products');
    },
    onError: (error) =>
      applyServerErrors(error, form.setError, [
        'sku',
        'name',
        'description',
        'priceAmount',
        'priceCurrency',
        'brand',
        'categorySlug',
        'imageUrls',
      ]),
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
        description="Set product details, pricing and publication for your collection."
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
            <Input label="Brand" {...form.register('brand')} error={form.formState.errors.brand?.message} />
            <Field label="Collection" error={form.formState.errors.categorySlug?.message}>
              {(fieldId, description) => (
                <select
                  id={fieldId}
                  aria-describedby={description}
                  {...form.register('categorySlug')}
                  // Keep the loaded assignment selected when category options arrive after the product.
                  value={form.watch('categorySlug') || ''}
                  disabled={categories.isPending}
                >
                  <option value="">Unassigned</option>
                  {categories.data
                    ?.filter((group) => group.isActive || group.slug === product.data?.categorySlug)
                    .map((group) => (
                      <option key={group.slug} value={group.slug}>
                        {group.name}
                        {group.isActive ? '' : ' (inactive)'}
                      </option>
                    ))}
                </select>
              )}
            </Field>
            {categories.error && (
              <ErrorState error={categories.error} retry={() => void categories.refetch()} />
            )}
            <Can permission={Permissions.ProductUpdate}>
              <p className="small">
                <Link className="text-link" to="/admin/collections">
                  Manage collections
                </Link>
              </p>
            </Can>
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
          <ProductPhotoEditor
            photos={form.watch('imageUrls')}
            disabled={mutation.isPending}
            onAdd={(files) => {
              const added = files.map((file) => {
                const preview = URL.createObjectURL(file);
                pendingPhotos.current.set(preview, file);
                return preview;
              });
              form.setValue('imageUrls', [...form.getValues('imageUrls'), ...added], {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            onRemove={(photo) => {
              if (pendingPhotos.current.has(photo)) {
                URL.revokeObjectURL(photo);
                pendingPhotos.current.delete(photo);
                uploadedPhotos.current.delete(photo);
              }
              form.setValue(
                'imageUrls',
                form.getValues('imageUrls').filter((entry) => entry !== photo),
                { shouldDirty: true, shouldValidate: true },
              );
            }}
            onPrimary={(photo) =>
              form.setValue(
                'imageUrls',
                [photo, ...form.getValues('imageUrls').filter((entry) => entry !== photo)],
                { shouldDirty: true },
              )
            }
          />
          {form.formState.errors.imageUrls?.message && (
            <p role="alert" className="field-error">
              {form.formState.errors.imageUrls.message}
            </p>
          )}
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
            Add up to eight photos. The primary photo appears in the catalog and cart; the product page shows
            the full gallery.
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

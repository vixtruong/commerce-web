import { useEffect, useRef, useState } from 'react';
import { Link, useBlocker } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import { api } from '../../api/client';
import { categoriesQuery, type Category } from '../catalog/api';
import { DataTable } from '../../components/DataTable';
import { ErrorState, PageHeader, Skeleton, EmptyState } from '../../components/Feedback';
import { Input } from '../../components/FormField';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Can } from '../../auth/Guards';
import { Permissions } from '../../auth/permissions';
import { applyServerErrors } from '../../lib/formErrors';

const schema = z.object({
  name: z.string().trim().min(1, 'Enter a collection name.').max(120),
  slug: z
    .string()
    .trim()
    .min(1, 'Enter a collection slug.')
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens.'),
});
type InputValues = z.infer<typeof schema>;

/** Manage Catalog-owned collections with stable links and explicit assignment availability. */
export default function CollectionsPage() {
  const client = useQueryClient();
  const categories = useQuery(categoriesQuery(true));
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [changing, setChanging] = useState<Category | null>(null);
  const [discard, setDiscard] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const form = useForm<InputValues>({ resolver: zodResolver(schema), defaultValues: { name: '', slug: '' } });
  const dirty = editing !== undefined && form.formState.isDirty;
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  const refresh = () => void client.invalidateQueries({ queryKey: ['catalog'] });
  const save = useMutation<void | Category, Error, InputValues>({
    mutationFn: (body: InputValues) =>
      editing
        ? api<void>('/api/catalog/categories/' + editing.slug, {
            method: 'PUT',
            body: { name: body.name, isActive: editing.isActive },
          })
        : api<Category>('/api/catalog/categories', { method: 'POST', body }),
    onSuccess: () => {
      form.reset();
      setEditing(undefined);
      refresh();
    },
    onError: (error) => applyServerErrors(error, form.setError, ['name', 'slug']),
  });
  const toggle = useMutation({
    mutationFn: (group: Category) =>
      api<void>('/api/catalog/categories/' + group.slug, {
        method: 'PUT',
        body: { name: group.name, isActive: !group.isActive },
      }),
    onSuccess: () => {
      setChanging(null);
      refresh();
    },
  });
  const open = (group: Category | null) => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    form.reset({ name: group?.name || '', slug: group?.slug || '' });
    save.reset();
    setEditing(group);
  };
  const columns: ColumnDef<Category>[] = [
    { accessorKey: 'name', header: 'Collection' },
    { accessorKey: 'slug', header: 'Slug' },
    { accessorKey: 'productCount', header: 'Active products' },
    {
      id: 'availability',
      header: 'Assignments',
      cell: (cell) => (cell.row.original.isActive ? 'Enabled' : 'Disabled'),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (cell) => (
        <div className="actions">
          <button className="text-link" type="button" onClick={() => open(cell.row.original)}>
            Edit
          </button>
          <button
            className="text-link"
            type="button"
            onClick={() => {
              toggle.reset();
              setChanging(cell.row.original);
            }}
          >
            {cell.row.original.isActive ? 'Disable' : 'Enable'}
          </button>
          <Link className="text-link" to={'/products?category=' + cell.row.original.slug}>
            View products
          </Link>
        </div>
      ),
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Collections"
        description="Group products for discovery. Slugs stay stable; disabling a collection stops new assignments and hides its storefront entry."
        action={
          <Can permission={Permissions.ProductCreate}>
            <button className="button" type="button" onClick={() => open(null)}>
              Create collection
            </button>
          </Can>
        }
      />
      {categories.isPending ? (
        <Skeleton />
      ) : categories.error ? (
        <ErrorState error={categories.error} retry={() => void categories.refetch()} />
      ) : categories.data.length ? (
        <DataTable
          data={categories.data}
          columns={columns}
          caption="Product collections and published counts"
        />
      ) : (
        <EmptyState
          title="No collections yet."
          description="Create a collection, then assign products using the product form."
        />
      )}
      <Dialog.Root
        open={editing !== undefined}
        onOpenChange={(value) => {
          if (!value && !save.isPending) {
            if (dirty) setDiscard(true);
            else setEditing(undefined);
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="dialog-content"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current?.focus();
            }}
          >
            <Dialog.Title>{editing ? 'Edit collection' : 'Create collection'}</Dialog.Title>
            <Dialog.Description>
              Assign products in the product editor. Collection counts come from published products.
            </Dialog.Description>
            <form onSubmit={form.handleSubmit((body) => save.mutate(body))} noValidate>
              <fieldset disabled={save.isPending}>
                <Input
                  label="Collection name"
                  required
                  {...form.register('name')}
                  error={form.formState.errors.name?.message}
                />
                <Input
                  label="Collection slug"
                  required
                  readOnly={!!editing}
                  {...form.register('slug')}
                  error={form.formState.errors.slug?.message}
                  hint={
                    editing
                      ? 'The slug is permanent so links and assignments stay valid.'
                      : 'Example: keyboards or power-banks'
                  }
                />
              </fieldset>
              {save.error && <ErrorState error={save.error} />}
              <div className="actions">
                <button className="button" disabled={save.isPending} type="submit">
                  {save.isPending ? 'Saving…' : 'Save collection'}
                </button>
                <Dialog.Close className="button secondary" type="button" disabled={save.isPending}>
                  Cancel
                </Dialog.Close>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ConfirmDialog
        open={!!changing}
        onOpenChange={(value) => {
          if (!value) setChanging(null);
        }}
        title={(changing?.isActive ? 'Disable' : 'Enable') + ' this collection?'}
        description="Existing products and orders are retained. Disabled groups stop new assignments and disappear from storefront navigation."
        pending={toggle.isPending}
        error={toggle.error}
        onConfirm={() => {
          if (changing) toggle.mutate(changing);
        }}
      />
      <ConfirmDialog
        open={discard || blocker.state === 'blocked'}
        onOpenChange={(value) => {
          if (!value) {
            setDiscard(false);
            if (blocker.state === 'blocked') blocker.reset();
          }
        }}
        title="Discard unsaved changes?"
        description="Your collection changes have not been saved."
        onConfirm={() => {
          setDiscard(false);
          setEditing(undefined);
          form.reset();
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
    </>
  );
}

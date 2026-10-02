import { messages } from '../lib/messages';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-list" role="status" aria-label={messages.loading}>
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <strong>{error.message}</strong>
      {error instanceof ApiError && error.requestId && <small>Request reference: {error.requestId}</small>}
      {retry && (
        <button className="button secondary" onClick={retry}>
          {messages.tryAgain}
        </button>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  code,
}: {
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
  code?: string;
}) {
  return (
    <section className="empty-state">
      {code && <span className="eyebrow">{code}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <Link className="button" to={action}>
          {actionLabel}
        </Link>
      )}
    </section>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}

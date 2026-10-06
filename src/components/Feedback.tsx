import { messages } from '../lib/messages';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { AlertCircle, ArrowRight, Inbox, RotateCcw } from 'lucide-react';
export function Skeleton({ rows = 4, variant = 'rows' }: { rows?: number; variant?: 'rows' | 'products' }) {
  return (
    <div
      className={'skeleton-list ' + (variant === 'products' ? 'skeleton-products' : '')}
      role="status"
      aria-label={messages.loading}
    >
      <span className="sr-only">{messages.loading}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton" key={i} aria-hidden="true" />
      ))}
    </div>
  );
}
export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <strong>{error.message}</strong>
      {error instanceof ApiError && error.requestId && <small>Request reference: {error.requestId}</small>}
      {retry && (
        <button className="button secondary" onClick={retry}>
          <RotateCcw size={15} aria-hidden="true" /> {messages.tryAgain}
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
      <span className="empty-icon" aria-hidden="true">
        <Inbox size={28} strokeWidth={1.5} />
      </span>
      {code && <span className="eyebrow">{code}</span>}
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <Link className="button" to={action}>
          {actionLabel} <ArrowRight size={16} aria-hidden="true" />
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
      {action && <div className="page-header-action">{action}</div>}
    </header>
  );
}

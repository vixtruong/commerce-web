import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { ErrorState, PageHeader, Skeleton } from '../../components/Feedback';
export default function SystemPage() {
  const health = useQuery({
    queryKey: ['system', 'health'],
    queryFn: ({ signal }) => api<string>('/health/ready', { signal, authenticated: false }),
    staleTime: 0,
  });
  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Gateway readiness"
        description="Public edge readiness and local development diagnostics."
        action={
          <button className="button secondary" onClick={() => void health.refetch()}>
            Check readiness
          </button>
        }
      />
      {health.isPending ? (
        <Skeleton rows={1} />
      ) : health.error ? (
        <ErrorState error={health.error} />
      ) : (
        <p className="notice" role="status">
          Gateway reports: <strong>{health.data}</strong>
        </p>
      )}
      <p>
        Readiness reports the Gateway's own checks. It does not certify that every downstream workflow is
        healthy.
      </p>
      <section className="info-panel">
        <h2>Local diagnostics</h2>
        <p>
          These links target the documented local Compose tools and require their own configured credentials.
        </p>
        <div className="tool-links">
          {[
            ['Grafana', 'http://localhost:3000'],
            ['Jaeger', 'http://localhost:16686'],
            ['Prometheus', 'http://localhost:9090'],
            ['RabbitMQ Management', 'http://localhost:15672'],
          ].map(([name, url]) => (
            <a key={name} className="text-link" href={url} target="_blank" rel="noreferrer">
              {name} ↗
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

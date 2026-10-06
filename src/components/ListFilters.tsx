import { messages } from '../lib/messages';
import type { useListParams } from '../hooks/useListParams';
import { statusFor } from '../lib/status';
export function ListFilters({
  list,
  statuses,
  placeholder = messages.search,
  dates = false,
  statusKind,
}: {
  list: ReturnType<typeof useListParams>;
  statuses?: string[];
  placeholder?: string;
  dates?: boolean;
  statusKind?: Parameters<typeof statusFor>[0];
}) {
  return (
    <div className="filters">
      <label className="search-field">
        {messages.search}
        <input
          type="search"
          placeholder={placeholder}
          value={list.draft}
          onChange={(e) => list.setDraft(e.target.value)}
        />
      </label>
      {statuses && (
        <label>
          Status
          <select
            value={list.params.get('status') || ''}
            onChange={(e) => list.set('status', e.target.value)}
          >
            <option value="">All states</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusKind ? statusFor(statusKind, s).label : s}
              </option>
            ))}
          </select>
        </label>
      )}
      {dates && (
        <>
          <label>
            From
            <input
              type="date"
              value={list.params.get('from') || ''}
              onChange={(e) => list.set('from', e.target.value)}
            />
          </label>
          <label>
            Before
            <input
              type="date"
              value={list.params.get('to') || ''}
              onChange={(e) => list.set('to', e.target.value)}
            />
          </label>
        </>
      )}
    </div>
  );
}

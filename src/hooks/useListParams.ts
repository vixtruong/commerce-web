import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
export function useListParams() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || params.get('q') || '';
  const [draft, setDraft] = useState(search);
  useEffect(() => {
    setDraft(search);
  }, [search]);
  useEffect(() => {
    if (draft === search) return;
    const timer = window.setTimeout(
      () =>
        setParams(
          (current) => {
            const next = new URLSearchParams(current);
            next.delete('q');
            next.set('search', draft);
            next.set('page', '1');
            return next;
          },
          { replace: true },
        ),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [draft, search, setParams]);
  const setMany = (values: Record<string, string>) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(values)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (Object.keys(values).some((key) => key !== 'page')) next.set('page', '1');
      return next;
    });
  const set = (key: string, value: string) => setMany({ [key]: value });
  return {
    params,
    draft,
    setDraft,
    set,
    setMany,
    page: Math.min(100000, Math.max(1, Math.floor(Number(params.get('page'))) || 1)),
    search,
  };
}

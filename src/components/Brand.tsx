import { Boxes } from 'lucide-react';

/** Shared identity for storefront, workspace and mobile navigation. */
export function Brand({ workspace = false }: { workspace?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-symbol" aria-hidden="true">
        <Boxes size={24} strokeWidth={1.7} />
      </span>
      <span className="brand-copy">
        <strong>
          commerce<span className="brand-dot">.</span>
        </strong>
        <small>{workspace ? 'Operations workspace' : 'Everyday essentials'}</small>
      </span>
    </span>
  );
}

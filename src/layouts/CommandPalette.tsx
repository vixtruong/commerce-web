import { useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Search, X } from 'lucide-react';
import type { User } from '../auth/permissions';
import { visibleNavigation } from './adminNavigation';

/** The portal unmounts this search when closed, clearing the previous search naturally. */
function CommandResults({
  user,
  close,
  searchRef,
}: {
  user: User | null | undefined;
  close: () => void;
  searchRef: RefObject<HTMLInputElement | null>;
}) {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const items = visibleNavigation(user).filter((item) =>
    (item.label + ' ' + item.group).toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <label className="command-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Search workspace areas</span>
        <input
          ref={searchRef}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Where would you like to go?"
        />
      </label>
      <p className="command-count" role="status">
        {items.length} available {items.length === 1 ? 'area' : 'areas'}
      </p>
      <div className="command-results">
        {items.map((item) => (
          <button
            key={item.href}
            onClick={() => {
              close();
              navigate(item.href);
            }}
          >
            <item.icon size={18} aria-hidden="true" />
            <span>
              {item.label}
              <small>{item.group}</small>
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
        ))}
        {!items.length && <p className="command-empty">No areas match. Try a different name.</p>}
      </div>
      <p className="command-help">
        <kbd>Tab</kbd> to move · <kbd>Enter</kbd> to open · <kbd>Esc</kbd> to close
      </p>
    </>
  );
}

/** Searchable navigation limited to the authenticated user's effective permissions. */
export function CommandPalette({
  open,
  onOpenChange,
  user,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null | undefined;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content command-palette"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            if (returnFocusRef?.current) {
              event.preventDefault();
              returnFocusRef.current.focus();
            }
          }}
        >
          <Dialog.Title>Go to an area</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search your available workspace areas. Use Tab and Enter to open an area.
          </Dialog.Description>
          <Dialog.Close className="icon-button dialog-close" aria-label="Close command palette">
            <X size={19} />
          </Dialog.Close>
          <CommandResults user={user} close={() => onOpenChange(false)} searchRef={searchRef} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

import { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, Search, X } from 'lucide-react';
import { useUser } from '../auth/useUser';
import { useUi } from '../stores/ui';
import { visibleNavigation } from './adminNavigation';
function Navigation({ close }: { close?: () => void }) {
  const user = useUser();
  const items = visibleNavigation(user.data);
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav aria-label="Operations navigation">
      {groups.map((group) => (
        <div key={group} className="nav-group">
          <span>{group}</span>
          {items
            .filter((i) => i.group === group)
            .map((item) => (
              <NavLink key={item.href} end={item.href === '/admin'} to={item.href} onClick={close}>
                {item.label}
              </NavLink>
            ))}
        </div>
      ))}
    </nav>
  );
}
export default function AdminLayout() {
  const user = useUser();
  const ui = useUi();
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUi.getState().setPalette(!useUi.getState().paletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/admin">
          commerce<span>OPERATIONS</span>
        </Link>
        <Navigation />
        <Link className="store-return" to="/">
          ← Open storefront
        </Link>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => ui.setSidebar(true)}
          >
            <Menu size={21} />
          </button>
          <span className="workspace-label">Commerce workspace</span>
          <button className="command-trigger" onClick={() => ui.setPalette(true)}>
            <Search size={16} /> Go to… <kbd>Ctrl K</kbd>
          </button>
          <Link to="/account" className="admin-user">
            {user.data?.email}
          </Link>
        </header>
        <main id="main-content" tabIndex={-1} className="admin-content">
          <Outlet />
        </main>
      </div>
      <Dialog.Root open={ui.sidebarOpen} onOpenChange={ui.setSidebar}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="nav-drawer">
            <Dialog.Title>Operations navigation</Dialog.Title>
            <Dialog.Description className="sr-only">Choose an area of the back office.</Dialog.Description>
            <Dialog.Close className="icon-button" aria-label="Close navigation">
              <X />
            </Dialog.Close>
            <Navigation close={() => ui.setSidebar(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={ui.paletteOpen} onOpenChange={ui.setPalette}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content command-palette">
            <Dialog.Title>Go to an area</Dialog.Title>
            <Dialog.Description>Keyboard navigation for your available workspace areas.</Dialog.Description>
            {visibleNavigation(user.data).map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  ui.setPalette(false);
                  navigate(item.href);
                }}
              >
                {item.label}
                <span>↵</span>
              </button>
            ))}
            <Dialog.Close className="button secondary">Close</Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

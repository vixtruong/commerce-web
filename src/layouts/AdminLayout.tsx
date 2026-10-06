import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, ChevronRight, Menu, Search, X } from 'lucide-react';
import { useUser } from '../auth/useUser';
import { useUi } from '../stores/ui';
import { visibleNavigation } from './adminNavigation';
import { Brand } from '../components/Brand';
import { CommandPalette } from './CommandPalette';
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
                <item.icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
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
  const location = useLocation();
  const commandTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const activeArea = visibleNavigation(user.data).find(
    (item) =>
      item.href !== '/admin' &&
      (location.pathname === item.href || location.pathname.startsWith(item.href + '/')),
  );
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
        <Link className="admin-brand" to="/admin" aria-label="Commerce workspace">
          <Brand workspace />
        </Link>
        <Navigation />
        <Link className="store-return" to="/">
          Open storefront <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </aside>
      <div className="admin-body">
        <header className="admin-topbar">
          <button
            className="icon-button mobile-menu"
            ref={drawerTriggerRef}
            aria-label="Open navigation"
            onClick={() => ui.setSidebar(true)}
          >
            <Menu size={21} />
          </button>
          <div className="workspace-label">
            <span>WORKSPACE</span>
            <strong>
              Commerce <ChevronRight size={14} aria-hidden="true" /> {activeArea?.label ?? 'Overview'}
            </strong>
          </div>
          <button
            className="command-trigger"
            ref={commandTriggerRef}
            aria-keyshortcuts="Control+K Meta+K"
            onClick={() => ui.setPalette(true)}
          >
            <Search size={16} aria-hidden="true" /> Go to… <kbd>Ctrl K</kbd>
          </button>
          <Link to="/account" className="admin-user">
            <span className="user-avatar" aria-hidden="true">
              {user.data?.email.charAt(0).toUpperCase()}
            </span>
            <span>{user.data?.email}</span>
          </Link>
        </header>
        <main id="main-content" tabIndex={-1} className="admin-content">
          <Outlet />
        </main>
      </div>
      <Dialog.Root open={ui.sidebarOpen} onOpenChange={ui.setSidebar}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content
            className="nav-drawer"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              drawerTriggerRef.current?.focus();
            }}
          >
            <Dialog.Title>Operations navigation</Dialog.Title>
            <Dialog.Description className="sr-only">Choose an area of the back office.</Dialog.Description>
            <Dialog.Close className="icon-button" aria-label="Close navigation">
              <X />
            </Dialog.Close>
            <Link className="admin-brand" to="/admin" onClick={() => ui.setSidebar(false)}>
              <Brand workspace />
            </Link>
            <Navigation close={() => ui.setSidebar(false)} />
            <Link className="store-return" to="/" onClick={() => ui.setSidebar(false)}>
              Open storefront <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <CommandPalette
        open={ui.paletteOpen}
        onOpenChange={ui.setPalette}
        user={user.data}
        returnFocusRef={commandTriggerRef}
      />
    </div>
  );
}

import { messages } from '../lib/messages';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { useUser } from '../auth/useUser';
import { Can } from '../auth/Guards';
import { Permissions } from '../auth/permissions';
export default function StorefrontLayout() {
  const user = useUser();
  const navigate = useNavigate();
  return (
    <div className="storefront">
      <div className="utility-bar">
        <span>Considered essentials for everyday work</span>
        <Can permission={Permissions.BackofficeAccess}>
          <Link to="/admin">Back office ↗</Link>
        </Can>
      </div>
      <header className="store-header">
        <Link className="wordmark" to="/">
          commerce
        </Link>
        <form
          className="header-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            navigate('/products?q=' + encodeURIComponent(String(form.get('q') || '')));
          }}
        >
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="Search the collection"
            name="q"
            placeholder="Find your next essential"
            type="search"
          />
          <button className="sr-only" type="submit">
            {messages.search}
          </button>
        </form>
        <div className="header-actions">
          <Link
            to={user.data ? '/account' : '/login'}
            aria-label={user.data ? 'Your account' : messages.signIn}
          >
            <UserRound size={21} />
            <span>{user.data ? 'Account' : messages.signIn}</span>
          </Link>
          <Link to="/cart" aria-label="Shopping cart">
            <ShoppingBag size={21} />
            <span>Cart</span>
          </Link>
        </div>
      </header>
      <nav className="store-nav" aria-label="Store navigation">
        <NavLink to="/products">All products</NavLink>
        <NavLink to="/orders">Your orders</NavLink>
        <NavLink to="/account">Your account</NavLink>
      </nav>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="store-footer">
        <div>
          <Link to="/" className="wordmark">
            commerce
          </Link>
          <p>Tools for work. Space for life.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <Link to="/products">The collection</Link>
          <Link to="/cart">Your cart</Link>
        </div>
        <div>
          <strong>Your account</strong>
          <Link to="/orders">{messages.orderHistory}</Link>
          <Link to="/account">Account overview</Link>
        </div>
        <p className="footer-note">
          Commerce reference application · Development payment provider · Sample product illustrations
        </p>
      </footer>
    </div>
  );
}

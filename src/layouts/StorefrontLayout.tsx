import { messages } from '../lib/messages';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Search, ShoppingBag, UserRound } from 'lucide-react';
import { useUser } from '../auth/useUser';
import { Can } from '../auth/Guards';
import { Permissions } from '../auth/permissions';
import { Brand } from '../components/Brand';

export default function StorefrontLayout() {
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const checkout = location.pathname.startsWith('/checkout');
  const filters = new URLSearchParams(location.search);
  const search = location.pathname === '/products' ? filters.get('search') || filters.get('q') || '' : '';
  return (
    <div className={'storefront' + (checkout ? ' checkout-shell' : '')}>
      <header className="store-masthead">
        <div className="store-header">
          <Link className="wordmark" to="/" aria-label="Commerce home">
            <Brand />
          </Link>
          {checkout ? (
            <Link to="/cart" className="checkout-return">
              <ArrowLeft size={16} aria-hidden="true" /> Back to cart
            </Link>
          ) : (
            <form
              className="header-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                navigate('/products?q=' + encodeURIComponent(String(form.get('q') || '')));
              }}
            >
              <Search size={19} aria-hidden="true" />
              <input
                key={location.pathname + ':' + search}
                defaultValue={search}
                aria-label="Search the collection"
                name="q"
                placeholder="Search products, names or SKUs"
                type="search"
              />
              <button className="icon-button" type="submit" aria-label={messages.search}>
                <ArrowUpRight size={19} aria-hidden="true" />
              </button>
            </form>
          )}
          <div className="header-actions">
            <Can permission={Permissions.BackofficeAccess}>
              <Link to="/admin" className="workspace-link">
                Workspace <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </Can>
            <Link
              to={user.data ? '/account' : '/login'}
              aria-label={user.data ? 'Your account' : messages.signIn}
            >
              <UserRound size={20} aria-hidden="true" />
              <span>{user.data ? 'Account' : messages.signIn}</span>
            </Link>
            {!checkout && (
              <Link to="/cart" aria-label="Shopping cart" className="cart-link">
                <ShoppingBag size={20} aria-hidden="true" />
                <span>Cart</span>
              </Link>
            )}
          </div>
        </div>
        {!checkout && (
          <div className="store-subnav">
            <nav className="store-nav" aria-label="Store navigation">
              <NavLink to="/" end>
                Discover
              </NavLink>
              <NavLink to="/products">Shop all</NavLink>
              <Link to="/products?sort=newest">New arrivals</Link>
              <NavLink to="/orders">Your orders</NavLink>
            </nav>
            <span className="store-tagline">Considered tools. Everyday possibilities.</span>
          </div>
        )}
      </header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="store-footer">
        <div>
          <Link to="/" className="wordmark" aria-label="Commerce home">
            <Brand />
          </Link>
          <p>Make room for better work.</p>
        </div>
        <div>
          <strong>Shop</strong>
          <Link to="/products">The collection</Link>
          <Link to="/products?sort=newest">New arrivals</Link>
          <Link to="/cart">Your cart</Link>
        </div>
        <div>
          <strong>Your account</strong>
          <Link to="/orders">{messages.orderHistory}</Link>
          <Link to="/account">Account overview</Link>
        </div>
        <p className="footer-note">
          <span>Commerce · Everyday essentials</span>
          <span>Development store · Sample illustrations · Development payments</span>
        </p>
      </footer>
    </div>
  );
}

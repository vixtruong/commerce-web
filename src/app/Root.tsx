import { messages } from '../lib/messages';
import { useEffect } from 'react';
import { Link, Outlet, useLocation, useRouteError } from 'react-router-dom';
import { ErrorState } from '../components/Feedback';
import { ApiError } from '../api/client';
export function Root() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Outlet />
    </>
  );
}
export function RouteError() {
  const error: unknown = useRouteError();
  return (
    <main className="route-error">
      <h1>{messages.routeFailed}</h1>
      <ErrorState error={error instanceof ApiError ? error : new Error(messages.returnAndRetry)} />
      <Link to="/" className="button">
        {messages.returnToStore}
      </Link>
    </main>
  );
}

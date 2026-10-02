import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { catalogQuery } from './api';
import { ProductCard } from './ProductCard';
import { ErrorState, Skeleton } from '../../components/Feedback';
export default function HomePage() {
  const products = useQuery(catalogQuery({ status: 'Active', pageSize: 4, sort: 'newest' }));
  return (
    <>
      <section className="retail-hero">
        <div className="hero-copy">
          <span className="eyebrow">The everyday collection / 01</span>
          <h1>
            A better place
            <br />
            to get things done.
          </h1>
          <p>Considered tools for your desk, your work, and the hours in between.</p>
          <Link className="button" to="/products">
            Explore the collection <span aria-hidden="true">↗</span>
          </Link>
          <span className="hero-note">Technology · Work essentials</span>
        </div>
        <div className="hero-image">
          <img
            src="/samples/laptop.svg"
            alt="Sample laptop illustration on a warm neutral background"
            width="640"
            height="480"
          />
          <span>Tools for everyday work</span>
        </div>
      </section>
      <section className="section">
        <div className="section-title">
          <div>
            <p className="eyebrow">Available now</p>
            <h2>The collection</h2>
          </div>
          <Link className="text-link" to="/products">
            Shop all products →
          </Link>
        </div>
        {products.isPending ? (
          <Skeleton />
        ) : products.error ? (
          <ErrorState error={products.error} retry={() => void products.refetch()} />
        ) : (
          <div className="product-grid">
            {products.data.items.map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
          </div>
        )}
      </section>
      <section className="editorial">
        <span className="eyebrow">A considered workspace</span>
        <h2>
          Fewer distractions.
          <br />
          More room for good work.
        </h2>
        <p>
          Browse the current collection, check availability, and keep track of every order from your account.
        </p>
        <Link to="/products" className="text-link">
          Find your next essential →
        </Link>
      </section>
    </>
  );
}

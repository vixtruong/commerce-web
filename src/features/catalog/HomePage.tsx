import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, PackageCheck } from 'lucide-react';
import { catalogQuery, categoriesQuery } from './api';
import { ProductCard } from './ProductCard';
import { ProductMedia } from './ProductMedia';
import { sampleMedia } from './sampleMedia';
import { money } from '../../lib/format';
import { EmptyState, ErrorState, Skeleton } from '../../components/Feedback';

export default function HomePage() {
  const products = useQuery(catalogQuery({ status: 'Active', pageSize: 8, sort: 'newest' }));
  const categories = useQuery(categoriesQuery());
  // Feature an actual available catalog entry with sample artwork when possible, never an invented offer.
  const selection = products.data?.items ?? [];
  const featured =
    selection.find((product) => product.imageUrl) ??
    selection.find((product) => sampleMedia(product.sku) !== '/samples/product.svg') ??
    selection[0];
  const arrivals = selection.filter((product) => product.id !== featured?.id).slice(0, 3);
  return (
    <>
      <section className="shop-intro" aria-labelledby="hero-heading">
        <div>
          <p className="eyebrow">Technology / Everyday essentials</p>
          <h1 id="hero-heading">
            Make room for
            <br />
            <span>better work.</span>
          </h1>
        </div>
        <div className="shop-intro-aside">
          <p>
            Thoughtful essentials for the way you work. Explore what’s available and find your next good
            thing.
          </p>
          <Link className="text-link" to="/products">
            Explore the collection <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      {products.isPending ? (
        <Skeleton rows={4} variant="products" />
      ) : products.error ? (
        <ErrorState error={products.error} retry={() => void products.refetch()} />
      ) : featured ? (
        <section className="merchandising-grid" aria-label="Featured products">
          <Link className="product-spotlight" to={'/products/' + featured.id}>
            <div className="spotlight-art">
              <span className="eyebrow">In focus / {featured.sku}</span>
              <ProductMedia product={featured} eager />
            </div>
            <div className="spotlight-copy">
              <span className="eyebrow">A closer look</span>
              <h2>{featured.name}</h2>
              <p>{money(featured.priceAmount, featured.priceCurrency)}</p>
              <span className="spotlight-action">
                Discover this product <ArrowRight size={18} aria-hidden="true" />
              </span>
            </div>
          </Link>
          <div className="arrival-panel">
            <div className="arrival-heading">
              <h2>New in the collection</h2>
              <Link to="/products?sort=newest" aria-label="Shop new arrivals">
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </div>
            {arrivals.length ? (
              <ul>
                {arrivals.map((product) => (
                  <li key={product.id}>
                    <Link to={'/products/' + product.id}>
                      <div className="arrival-image">
                        <ProductMedia product={product} eager />
                      </div>
                      <div>
                        <h3>{product.name}</h3>
                        <p>{money(product.priceAmount, product.priceCurrency)}</p>
                        <small>{product.sku}</small>
                      </div>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Explore the available collection for your next essential.</p>
            )}
            <Link className="arrival-footer" to="/products?sort=newest">
              See the latest additions <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <EmptyState
          title="The collection is getting ready."
          description="Check back soon for available products."
        />
      )}
      <section className="section" aria-labelledby="groups-heading">
        <div className="section-title">
          <div>
            <p className="eyebrow">Find your setup</p>
            <h2 id="groups-heading">Shop by collection.</h2>
          </div>
        </div>
        {categories.isPending ? (
          <Skeleton rows={2} />
        ) : categories.error ? (
          <ErrorState error={categories.error} retry={() => void categories.refetch()} />
        ) : (
          <div className="collection-groups">
            {categories.data
              .filter((group) => group.productCount > 0)
              .map((group) => (
                <Link key={group.slug} to={'/products?category=' + encodeURIComponent(group.slug)}>
                  <strong>{group.name}</strong>
                  <span>
                    {group.productCount} products <ArrowUpRight size={16} aria-hidden="true" />
                  </span>
                </Link>
              ))}
          </div>
        )}
      </section>
      {selection.length > 0 && (
        <section className="section" aria-labelledby="collection-heading">
          <div className="section-title">
            <div>
              <p className="eyebrow">Discover / 01</p>
              <h2 id="collection-heading">Everyday essentials.</h2>
            </div>
            <Link className="text-link" to="/products">
              View all products <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="product-grid">
            {selection.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </section>
      )}
      <section className="order-service-strip">
        <PackageCheck size={25} aria-hidden="true" />
        <div>
          <h2>Your order, from start to finish.</h2>
          <p>Review your selection and follow processing updates in your account.</p>
        </div>
        <Link className="text-link" to="/orders">
          Your orders <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </section>
    </>
  );
}

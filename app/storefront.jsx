'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Search, ShoppingBag } from 'lucide-react';

const API_CANDIDATES = Array.from(new Set([
  process.env.NEXT_PUBLIC_API_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean)));

const fa = (value) => new Intl.NumberFormat('fa-IR', {
  maximumFractionDigits: 0,
}).format(Number(value ?? 0));

export default function Storefront({ initialProducts, initialMeta }) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState(initialMeta);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page, limit: 8 });
      if (search) params.set('name', search);

      for (const baseUrl of API_CANDIDATES) {
        try {
          const response = await fetch(`${baseUrl}/products?${params}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'خطایی رخ داد.');
          setProducts(result.data || []);
          setMeta(result);
          setError('');
          setLoading(false);
          return;
        } catch (fetchError) {
          setError(fetchError.message);
        }
      }

      setProducts([]);
      setLoading(false);
    };

    loadProducts();
  }, [page, search]);

  const totalInventory = useMemo(
    () => products.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [products],
  );

  const avgPrice = useMemo(() => {
    if (!products.length) return 0;
    return products.reduce((sum, item) => sum + Number(item.price || 0), 0) / products.length;
  }, [products]);

  return (
    <main className="storefront" dir="rtl">
      <header className="store-topbar">
        <div className="brand-wrap">
          <img className="brand-logo" src="/botostart-logo.png" alt="Mahdi Store" />
          <div>
            <strong>Mahdi Store</strong>
            <small>فروشگاه آنلاین</small>
          </div>
        </div>

        <nav className="store-nav">
          <Link href="/" className="nav-link active">فروشگاه</Link>
          <Link href="/admin" className="nav-link">پنل مدیریت</Link>
        </nav>
      </header>

      <section className="hero-section">
        <div>
          <p className="eyebrow">محصولات منتخب</p>
          <h1>موجودی، قیمت و فروشگاه شما در یک نگاه</h1>
          <p className="hero-copy">
            پنل مدیریتی اختصاصی برای کنترل موجودی، مدیریت قیمت و نمایش محصولات در فروشگاه شخصی.
          </p>
          <div className="hero-actions">
            <Link href="/admin" className="blue-button">ورود به پنل</Link>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <span>کل محصولات</span>
            <strong>{fa(meta.totalProducts || products.length)}</strong>
          </div>
          <div className="metric-card">
            <span>موجودی کل</span>
            <strong>{fa(totalInventory)}</strong>
          </div>
          <div className="metric-card">
            <span>میانگین قیمت</span>
            <strong>{fa(avgPrice)} هزار</strong>
          </div>
        </div>
      </section>

      <section className="catalog-toolbar">
        <div className="catalog-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="جستجوی نام محصول"
          />
        </div>
        <div className="catalog-status">
          <ShoppingBag size={18} />
          <span>{loading ? 'در حال بارگذاری...' : `${fa(products.length)} محصول نمایش داده می‌شود`}</span>
        </div>
      </section>

      {error && <p className="error-banner">{error}</p>}

      <section className="product-grid">
        {loading ? (
          <div className="catalog-empty">در حال دریافت محصولات ...</div>
        ) : products.length === 0 ? (
          <div className="catalog-empty">محصولی برای نمایش وجود ندارد.</div>
        ) : products.map((product) => (
          <article key={product.id} className="product-card">
            <div className="product-tag">کالای آماده</div>
            <h3>{product.name}</h3>
            <p className="product-price">{fa(product.price)} هزار تومان</p>
            <div className="product-meta">
              <span>موجودی: {fa(product.quantity)}</span>
              <span>شناسه: {product.id.slice(0, 8)}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="store-pagination">
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="صفحه قبل">
          <ChevronRight size={17} />
        </button>
        <span>صفحه {fa(page)} از {fa(meta.totalPages || 1)}</span>
        <button type="button" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((current) => current + 1)} aria-label="صفحه بعد">
          <ChevronLeft size={17} />
        </button>
      </div>
    </main>
  );
}

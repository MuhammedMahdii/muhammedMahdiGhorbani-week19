import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  LogOut,
  Search,
  Settings2,
  ShoppingBag,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'stockroom-token';
const PAGE_LIMIT = 5;

const fa = (value) => Number(value || 0).toLocaleString('fa-IR');
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function getStoredUsername() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return 'مدیر';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.username || 'مدیر';
  } catch {
    return 'مدیر';
  }
}

async function api(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = response.status === 204 ? null : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'خطایی رخ داد.');
  }

  return body;
}

function Auth({ onLogin }) {
  const [registerMode, setRegisterMode] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', repeat: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const changeField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (registerMode && form.password !== form.repeat) {
      setError('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    setBusy(true);

    try {
      if (registerMode) {
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username: form.username.trim(),
            password: form.password,
          }),
        });

        setRegisterMode(false);
        setForm({ username: form.username.trim(), password: '', repeat: '' });
        return;
      }

      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });

      localStorage.setItem(TOKEN_KEY, result.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page" dir="rtl">
      <h1>پنل مدیریت فروشگاه مهدی</h1>

      <section className="auth-card">
        <img className="auth-logo" src="/botostart-logo.png" alt="Mahdi Store" />
        <h2>{registerMode ? 'ثبت نام' : 'ورود'}</h2>

        <form onSubmit={submit}>
          <input
            aria-label="نام کاربری"
            required
            value={form.username}
            onChange={changeField('username')}
            placeholder="نام کاربری"
          />

          <input
            aria-label="رمز عبور"
            required
            type="password"
            value={form.password}
            onChange={changeField('password')}
            placeholder="رمز عبور"
          />

          {registerMode && (
            <input
              aria-label="تکرار رمز عبور"
              required
              type="password"
              value={form.repeat}
              onChange={changeField('repeat')}
              placeholder="تکرار رمز عبور"
            />
          )}

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="blue-button" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" /> لطفاً صبر کنید...
              </>
            ) : registerMode ? (
              'ثبت نام'
            ) : (
              'ورود'
            )}
          </button>
        </form>

        <button
          type="button"
          className="auth-link"
          onClick={() => {
            setRegisterMode((value) => !value);
            setError('');
          }}
        >
          {registerMode ? 'حساب کاربری دارید؟' : 'ایجاد حساب کاربری'}
        </button>
      </section>
    </main>
  );
}

function Dialog({ children, className = '' }) {
  return (
    <div className="dialog-backdrop">
      <section className={`dialog ${className}`}>{children}</section>
    </div>
  );
}

function ProductDialog({ product, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    quantity: product?.quantity ?? '',
    price: product?.price ?? '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const changeField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    const nextProduct = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      price: Number(form.price),
    };

    if (!nextProduct.name) {
      setError('نام کالا الزامی است.');
      return;
    }

    if (!Number.isFinite(nextProduct.quantity) || nextProduct.quantity < 0) {
      setError('تعداد موجودی باید عددی معتبر باشد.');
      return;
    }

    if (!Number.isFinite(nextProduct.price) || nextProduct.price < 0) {
      setError('قیمت باید عددی معتبر باشد.');
      return;
    }

    setBusy(true);

    try {
      await Promise.all([
        api(product ? `/products/${product.id}` : '/products', {
          method: product ? 'PUT' : 'POST',
          body: JSON.stringify(nextProduct),
        }),
        wait(650),
      ]);

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog>
      <div className="dialog-head">
        <h3>{product ? 'ویرایش اطلاعات' : 'افزودن محصول جدید'}</h3>
        <button type="button" className="close-button" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <form className="product-dialog-form" onSubmit={submit}>
        <label>
          نام کالا
          <input required value={form.name} onChange={changeField('name')} placeholder="نام کالا" />
        </label>

        <label>
          تعداد موجودی
          <input
            required
            type="text"
            inputMode="numeric"
            value={form.quantity}
            onChange={changeField('quantity')}
            placeholder="تعداد"
          />
        </label>

        <label>
          قیمت
          <input
            required
            type="text"
            inputMode="decimal"
            value={form.price}
            onChange={changeField('price')}
            placeholder="قیمت"
          />
        </label>

        {error && <p className="error-text">{error}</p>}

        <div className="dialog-actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            انصراف
          </button>
          <button type="submit" className="blue-button" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" /> در حال ثبت
              </>
            ) : product ? (
              'ثبت اطلاعات جدید'
            ) : (
              'ایجاد'
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function DeleteDialog({ onClose, onDelete }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onDelete();
      await wait(650);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog className="delete-dialog">
      <div className="delete-icon">
        <X size={32} />
      </div>
      <p>آیا از حذف این محصول مطمئنید؟</p>
      <div className="dialog-actions">
        <button type="button" className="cancel-button" onClick={onClose} disabled={busy}>
          لغو
        </button>
        <button type="button" className="delete-button" onClick={confirm} disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> در حال حذف...
            </>
          ) : (
            'حذف'
          )}
        </button>
      </div>
    </Dialog>
  );
}

function Dashboard({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ totalProducts: 0, totalPages: 1 });
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const user = useMemo(() => getStoredUsername(), []);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PAGE_LIMIT });
      if (search) {
        params.set('name', search);
      }

      const result = await api(`/products?${params}`);
      setProducts(result.data);
      setMeta(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, page]);

  const remove = async () => {
    if (!deleteTarget) return;

    try {
      await api(`/products/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  return (
    <main className="dashboard" dir="rtl">
      <header className="dashboard-header">
        <div className="profile">
          <span className="avatar">
            <UserRound size={20} />
          </span>
          <div>
            <strong>{user === 'milad' ? 'میلاد عظمی' : user}</strong>
            <small>مدیر</small>
          </div>
        </div>

        <div className="search-field">
          <Search size={19} />
          <input value={search} onChange={updateSearch} placeholder="جستجو کالا" />
        </div>
      </header>

      <section className="dashboard-content">
        <div className="title-row">
          <h1>
            <Settings2 size={24} /> مدیریت کالا
          </h1>
          <button type="button" className="blue-button add-product" onClick={() => setModal('new')}>
            افزودن محصول
          </button>
        </div>

        {error && <p className="error-banner">{error}</p>}

        <section className="product-table-card">
          <table>
            <thead>
              <tr>
                <th>نام کالا</th>
                <th>موجودی</th>
                <th>قیمت</th>
                <th>شناسه کالا</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="empty">
                    <span className="table-spinner" /> در حال دریافت اطلاعات...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty">
                    محصولی پیدا نشد.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{fa(product.quantity)}</td>
                    <td>{fa(product.price)} هزار تومان</td>
                    <td className="id-cell">{product.id.slice(0, 18)}</td>
                    <td className="actions">
                      <button type="button" className="edit" aria-label="ویرایش" onClick={() => setModal(product)}>
                        <Edit3 size={17} />
                      </button>
                      <button type="button" className="trash" aria-label="حذف" onClick={() => setDeleteTarget(product)}>
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="صفحه قبل">
            <ChevronRight size={17} />
          </button>

          <span>
            صفحه {fa(page)} از {fa(meta.totalPages || 1)}
          </span>

          <button type="button" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((current) => current + 1)} aria-label="صفحه بعد">
            <ChevronLeft size={17} />
          </button>
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>
          <img className="footer-logo" src="/botostart-logo.png" alt="" /> Mahdi Store
        </span>

        <button type="button" onClick={onLogout}>
          <LogOut size={14} /> خروج
        </button>
      </footer>

      {modal && (
        <ProductDialog
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => load()}
        />
      )}

      {deleteTarget && <DeleteDialog onClose={() => setDeleteTarget(null)} onDelete={remove} />}
    </main>
  );
}

function Storefront({ onOpenAdmin }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ totalProducts: 0, totalPages: 1 });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 8 });
      if (search) {
        params.set('name', search);
      }

      const result = await api(`/products?${params}`);
      setProducts(result.data || []);
      setMeta(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  const totalInventory = useMemo(
    () => products.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [products],
  );

  const avgPrice = useMemo(() => {
    if (!products.length) return 0;
    const sum = products.reduce((total, item) => total + Number(item.price || 0), 0);
    return sum / products.length;
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
          <button type="button" className="nav-link active">
            فروشگاه
          </button>
          <button type="button" className="nav-link" onClick={onOpenAdmin}>
            پنل مدیریت
          </button>
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
            <button type="button" className="blue-button" onClick={onOpenAdmin}>
              ورود به پنل
            </button>
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
        ) : (
          products.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-tag">کالای آماده</div>
              <h3>{product.name}</h3>
              <p className="product-price">{fa(product.price)} هزار تومان</p>
              <div className="product-meta">
                <span>موجودی: {fa(product.quantity)}</span>
                <span>شناسه: {product.id.slice(0, 8)}</span>
              </div>
            </article>
          ))
        )}
      </section>

      <div className="store-pagination">
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
          <ChevronRight size={17} />
        </button>
        <span>
          صفحه {fa(page)} از {fa(meta.totalPages || 1)}
        </span>
        <button type="button" disabled={page >= (meta.totalPages || 1)} onClick={() => setPage((current) => current + 1)}>
          <ChevronLeft size={17} />
        </button>
      </div>
    </main>
  );
}

function App() {
  const [view, setView] = useState('store');
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  if (view === 'admin') {
    return loggedIn ? (
      <Dashboard
        onLogout={() => {
          localStorage.removeItem(TOKEN_KEY);
          setLoggedIn(false);
          setView('store');
        }}
      />
    ) : (
      <Auth
        onLogin={() => {
          setLoggedIn(true);
          setView('admin');
        }}
      />
    );
  }

  return <Storefront onOpenAdmin={() => setView('admin')} />;
}

createRoot(document.getElementById('root')).render(<App />);

import '../src/styles.css';

export const metadata = {
  title: 'Mahdi Store | فروشگاه آنلاین',
  description: 'فروشگاه آنلاین و مدیریت محصولات Mahdi Store',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}

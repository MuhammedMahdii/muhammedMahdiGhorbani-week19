import Storefront from './storefront';

export const revalidate = 60;

async function getProducts() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${apiUrl}/products?page=1&limit=8`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return { data: [], totalProducts: 0, totalPages: 1 };
    return response.json();
  } catch {
    return { data: [], totalProducts: 0, totalPages: 1 };
  }
}

export default async function HomePage() {
  const result = await getProducts();

  return <Storefront initialProducts={result.data || []} initialMeta={result} />;
}

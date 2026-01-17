import CatalogBrowser from '@/app/CatalogBrowser';

export default function CatalogPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Catalog Browser</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Search products by keyword (part number, title, vendor name) and browse
        results.
      </p>

      <div style={{ marginTop: 16 }}>
        <CatalogBrowser />
      </div>
    </main>
  );
}

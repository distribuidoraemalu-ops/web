"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

import type { CatalogResponse, Product } from "@/types/catalog";

function buildCatalogUrl({
  keywords,
  page,
  pageSize,
}: {
  keywords: string[];
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  keywords.filter(Boolean).forEach((k) => params.append("keyword", k));
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `/api/catalog?${params.toString()}`;
}

export default function CatalogBrowser() {
  const [input, setInput] = useState(""); // raw input "hp probook"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const [data, setData] = useState<CatalogResponse | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce to avoid hammering your API
  const debounceRef = useRef<number | null>(null);

  // Turn input into keyword array (simple split)
  const keywords = useMemo(() => {
    return input
      .split(/[,\s]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
  }, [input]);

  const canPrev = page > 1;
  const canNext = useMemo(() => {
    // If totalPages exists, obey it; else allow next if we got full page results
    if (data?.totalPages) return page < data.totalPages;
    return items.length === pageSize;
  }, [data?.totalPages, page, items.length, pageSize]);

  const fetchCatalog = async (p: number) => {
    setLoading(true);
    setError(null);

    const url = buildCatalogUrl({ keywords, page: p, pageSize });

    try {
      const res = await fetch(url, { method: "GET" });
      console.log(res);
      const json = await res.json();

      if (!res.ok) {
        // ✅ Client logging: no secrets involved (only correlationId returned)
        console.error("Catalog fetch error", json);
        setError(
          json?.error
            ? `${json.error} (corr: ${json.correlationId})`
            : "Request failed"
        );
        setData(null);
        setItems([]);
        return;
      }

      const typed = json as CatalogResponse;
      setData(typed);
      setItems(typed.items);
    } catch (e) {
      console.error("Catalog fetch failed", e);
      setError("Network error");
      setData(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Live search: debounce when keywords/pageSize change
  useEffect(() => {
    setPage(1); // reset to first page when search changes
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      fetchCatalog(1);
    }, 350);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords.join("|"), pageSize]);

  // Fetch when page changes (no debounce)
  useEffect(() => {
    fetchCatalog(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      {/* Controls */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search keywords: e.g. hp probook 450"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            outline: "none",
          }}
        />

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
          }}
        >
          {[12, 24, 36, 48, 60].map((n) => (
            <option key={n} value={n}>
              {n}/page
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
      >
        <div style={{ opacity: 0.8 }}>
          {loading
            ? "Loading…"
            : error
            ? error
            : data
            ? `Corr: ${data.correlationId}`
            : "—"}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => canPrev && setPage((p) => p - 1)}
            disabled={!canPrev || loading}
            style={{ padding: "8px 10px", borderRadius: 10 }}
          >
            Prev
          </button>

          <span style={{ minWidth: 70, textAlign: "center" }}>
            Page {page}
            {data?.totalPages ? ` / ${data.totalPages}` : ""}
          </span>

          <button
            onClick={() => canNext && setPage((p) => p + 1)}
            disabled={!canNext || loading}
            style={{ padding: "8px 10px", borderRadius: 10 }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Results */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((p) => (
          <article
            key={p.id}
            style={{
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: 14,
              padding: 12,
              display: "grid",
              gap: 8,
            }}
          >
            <div
              style={{
                height: 140,
                borderRadius: 12,
                background: "rgba(0,0,0,0.04)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              {p.imageUrl ? (
                // Using <img> keeps it simple; if you use next/image you must configure remotePatterns
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <span style={{ opacity: 0.6 }}>No image</span>
              )}
            </div>

            <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{p.title}</div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              SKU: {p.sku} {p.vendorName ? `• ${p.vendorName}` : ""}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 700 }}>
                {p.price !== undefined ? `${p.currency ?? ""} ${p.price}` : "—"}
              </div>
              <div style={{ opacity: 0.8 }}>
                Stock: {p.stock !== undefined ? p.stock : "—"}
              </div>
            </div>
          </article>
        ))}

        {!loading && !error && items.length === 0 && (
          <div style={{ opacity: 0.7 }}>No products found.</div>
        )}
      </div>
    </section>
  );
}

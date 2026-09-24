"use client";

import { useMemo, useState, useEffect } from "react";
import productsData from "@/data/products.json";
import vendorsData from "@/data/vendors.json";
import type { Product, Vendor } from "@/lib/types";
import { CartProvider } from "@/lib/cart";
import ProductCard from "@/components/ProductCard";
import CartAndCheckout from "@/components/CartAndCheckout";

const products = productsData as Product[];
const vendors = vendorsData as Vendor[];
const categories = Array.from(new Set(products.map((p) => p.cat)));

export default function HomePage() {
  const [activeCat, setActiveCat] = useState(categories[0]);
  const [originVendor, setOriginVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    const found = vendors.find((x) => x.key === v);
    if (found) {
      setOriginVendor(found);
      try {
        localStorage.setItem("serena_vendor_origen", found.key);
      } catch {}
    } else {
      try {
        const saved = localStorage.getItem("serena_vendor_origen");
        const savedVendor = vendors.find((x) => x.key === saved);
        if (savedVendor) setOriginVendor(savedVendor);
      } catch {}
    }
  }, []);

  const grouped = useMemo(
    () => categories.map((cat) => ({ cat, items: products.filter((p) => p.cat === cat) })),
    []
  );

  return (
    <CartProvider>
      <div className="hero relative max-w-[520px] mx-auto overflow-hidden bg-bg2">
        <img
          src="/images/cover.jpg"
          alt="Serena Home — Catálogo mayorista 2026"
          className="w-full h-auto block"
        />
        {originVendor && (
          <div className="absolute top-[18px] right-[18px] z-10 flex items-center gap-2 bg-[rgba(44,46,53,.62)] backdrop-blur-[2px] border border-white/30 pl-[7px] pr-[14px] py-[7px] rounded-full text-[12.5px] text-[#fffaf0]">
            <div className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center font-serif text-xs text-white shrink-0">
              {originVendor.name.charAt(0)}
            </div>
            <span>
              Asesor: <strong>{originVendor.name}</strong>
            </span>
          </div>
        )}
      </div>

      <nav className="sticky top-0 z-40 bg-bg border-b border-line px-[6vw] py-3.5 flex gap-2.5 overflow-x-auto">
        {categories.map((cat) => (
          
            key={cat}
            href={`#${slug(cat)}`}
            onClick={() => setActiveCat(cat)}
            className={`flex-shrink-0 border rounded-full px-4.5 px-[18px] py-2 text-[13.5px] font-medium whitespace-nowrap ${
              activeCat === cat
                ? "border-terracotta text-terracottaDark bg-[#fbf1e8]"
                : "bg-card border-line text-inkSoft"
            }`}
          >
            {cat}
          </a>
        ))}
      </nav>

      <div>
        {grouped.map(({ cat, items }) => (
          <section key={cat} id={slug(cat)} className="px-[6vw] pt-12 pb-2.5">
            <h2 className="font-serif text-[28px] mb-1">{cat}</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(255px,1fr))] gap-5 mt-4">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="px-[6vw] pt-10 pb-24 text-center text-inkSoft text-[12.5px] border-t border-line mt-8">
        <div className="font-serif text-xl text-terracottaDark mb-2">Serena Home</div>
        Catálogo mayorista · Hilos que diseñan tu descanso
      </footer>

      <CartAndCheckout vendors={vendors} originVendor={originVendor} />
    </CartProvider>
  );
}

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");
}

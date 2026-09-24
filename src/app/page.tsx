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

  // El asesor de origen se toma en silencio del link (?v=lina), sin bloquear
  // la entrada al catálogo — se usa como asesor por defecto en el checkout,
  // pero el cliente puede cambiarlo ahí si quiere.
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
      <div
        className="hero relative min-h-[38vh] flex items-end bg-terracottaDark bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(44,36,28,.05) 0%, rgba(44,36,28,.45) 65%, rgba(44,36,28,.80) 100%), url('/images/cover.jpg')",
        }}
      >
        <div className="relative z-10 px-[6vw] py-8 max-w-[760px]">
          <div className="text-[#f0d9b8] text-xs tracking-wide mb-1.5 font-semibold">
            CATÁLOGO MAYORISTA 2026
          </div>
          <p className="text-[#f3ead9] text-sm max-w-[480px] leading-relaxed">
            Textiles de cama y hogar premium para hoteles, alquileres y tiendas. Arma tu pedido y
            envíalo directo por WhatsApp.
          </p>
        </div>
      </div>

      <nav className="sticky top-0 z-40 bg-bg border-b border-line px-[6vw] py-3.5 flex gap-2.5 overflow-x-auto">
        {categories.map((cat) => (
          <a
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

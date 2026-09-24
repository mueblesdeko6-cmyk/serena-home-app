"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart, fmtCOP } from "@/lib/cart";

export default function ProductCard({ product }: { product: Product }) {
  const { addLine } = useCart();
  const [sizeIdx, setSizeIdx] = useState(0);
  const [colorIdx, setColorIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const size = product.sizes[sizeIdx];
  const color = product.colors[colorIdx] || "";

  const handleAdd = () => {
    addLine({
      id: `${product.id}-${size[0]}${color ? "-" + color : ""}`,
      productId: product.id,
      name: product.name,
      sizeLabel: size[0],
      color,
      price: size[1],
      qty,
      imageSlug: product.image_slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden flex flex-col border border-line shadow-sm">
      <div className="relative aspect-[16/9] bg-white overflow-hidden">
        {/* Sube la foto real a /public/images/<image_slug> o a Supabase Storage */}
        <img
          src={`/images/${product.image_slug}`}
          alt={product.name}
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.opacity = "0.15";
          }}
        />
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="text-[11px] text-gold font-semibold tracking-wide">
          {product.cat}
        </div>
        <div className="font-serif text-lg leading-tight">{product.name}</div>
        <p className="text-[12.5px] text-inkSoft leading-relaxed">{product.desc}</p>

        {product.colors.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {product.colors.map((c, i) => (
              <button
                key={c}
                onClick={() => setColorIdx(i)}
                className={`text-[10.5px] border rounded-full px-2.5 py-1 transition-colors ${
                  i === colorIdx
                    ? "bg-darkBtn border-darkBtn text-white font-semibold"
                    : "bg-white border-line text-inkSoft"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap mt-0.5">
          {product.sizes.map((s, i) => (
            <button
              key={s[0]}
              onClick={() => setSizeIdx(i)}
              className={`text-xs font-semibold border rounded-md px-2.5 py-1.5 ${
                i === sizeIdx
                  ? "bg-darkBtn border-darkBtn text-white"
                  : "bg-white border-line text-[#4a4238]"
              }`}
            >
              {s[0]}
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2.5 pt-2">
          <div className="bg-terracotta text-white px-3 py-2 rounded-md font-serif text-base leading-tight">
            {fmtCOP(size[1])}
            <small className="block font-sans text-[10px] font-semibold opacity-85">
              por unidad
            </small>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-line rounded-md">
              <button
                className="w-7 h-8 text-[#4a4238]"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="w-6 text-center text-sm">{qty}</span>
              <button
                className="w-7 h-8 text-[#4a4238]"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              className={`text-white text-[12.5px] font-semibold px-3.5 py-2.5 rounded-md transition-colors ${
                added ? "bg-[#6f8c5f]" : "bg-darkBtn hover:bg-terracotta"
              }`}
            >
              {added ? "Agregado ✓" : "Agregar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

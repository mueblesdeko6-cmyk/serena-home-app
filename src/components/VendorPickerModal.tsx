"use client";

import type { Vendor } from "@/lib/types";

export default function VendorPickerModal({
  vendors,
  onPick,
  onClose,
}: {
  vendors: Vendor[];
  onPick: (v: Vendor) => void;
  onClose?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-[rgba(30,22,14,.5)] flex items-center justify-center p-5">
      <div className="bg-card w-full max-w-[440px] rounded-xl p-7 max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-2xl mb-1.5">¿Quién te va a atender?</h3>
        <p className="text-[13.5px] text-inkSoft mb-5">
          Elige tu asesor(a) para que tu pedido llegue directo a la persona correcta.
        </p>
        <div className="flex flex-col gap-2.5">
          {vendors.map((v) => (
            <button
              key={v.key}
              onClick={() => onPick(v)}
              className="text-left bg-bg border border-line rounded-lg px-4 py-3.5 flex justify-between items-center hover:border-terracotta"
            >
              <span>{v.name}</span>
              <span className="text-xs text-[#a39a8a]">{v.city}</span>
            </button>
          ))}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="block mt-4 text-[12.5px] text-inkSoft underline mx-auto"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useCart, fmtCOP } from "@/lib/cart";
import { buildQuoteImage, buildQuoteNumber } from "@/lib/quote";
import { createClient } from "@/lib/supabase/client";
import type { Vendor } from "@/lib/types";
import VendorPickerModal from "./VendorPickerModal";

const OWNER_WHATSAPP = process.env.NEXT_PUBLIC_OWNER_WHATSAPP || "";

type Step = "closed" | "cart" | "vendor" | "checkout" | "success";

export default function CartAndCheckout({
  vendors,
  originVendor,
}: {
  vendors: Vendor[];
  originVendor: Vendor | null;
}) {
  const { cart, removeLine, setQty, clear, total, count } = useCart();
  const [step, setStep] = useState<Step>("closed");
  const [vendor, setVendor] = useState<Vendor | null>(originVendor);
  const [name, setName] = useState("");
  const [nit, setNit] = useState("");
  const [city, setCity] = useState("");
  const [sending, setSending] = useState(false);
  const [quoteImgUrl, setQuoteImgUrl] = useState<string | null>(null);
  const [quoteBlob, setQuoteBlob] = useState<Blob | null>(null);
  const [orderNo, setOrderNo] = useState("");

  if (step === "closed") {
    return (
      count > 0 && (
        <button
          onClick={() => setStep("cart")}
          className="fixed right-5 bottom-5 z-[60] bg-terracotta text-white rounded-full pl-4 pr-5 py-3.5 flex items-center gap-2.5 font-bold text-sm shadow-lg"
        >
          🛒 Ver pedido
          <span className="bg-darkBtn rounded-full w-5.5 h-5.5 w-[22px] h-[22px] flex items-center justify-center text-xs">
            {count}
          </span>
        </button>
      )
    );
  }

  const goCheckout = () => {
    if (!vendor) {
      setStep("vendor");
      return;
    }
    setStep("checkout");
  };

  const handleSend = async () => {
    if (!name.trim() || !vendor) return;
    setSending(true);
    const now = new Date();
    const no = buildQuoteNumber(now);
    const dateStr = now.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const { blob } = await buildQuoteImage({
      orderNo: no,
      dateStr,
      vendor,
      clientName: name.trim(),
      clientNit: nit.trim(),
      clientCity: city.trim(),
      cart,
      logoSrc: "/logo.png",
    });

    setOrderNo(no);
    setQuoteBlob(blob);
    setQuoteImgUrl(URL.createObjectURL(blob));

    // Registrar SIEMPRE la cotización generada, aunque el cliente no la envíe
    // por WhatsApp después (punto pedido explícitamente por Daniela).
    try {
      const supabase = createClient();
      await supabase.from("quotes").insert({
        numero: no,
        cliente_nombre: name.trim(),
        cliente_nit: nit.trim() || null,
        cliente_ciudad: city.trim() || null,
        asesor_origen: originVendor?.key || null,
        asesor_seleccionado: vendor.key,
        productos: cart,
        cantidad_items: cart.reduce((s, l) => s + l.qty, 0),
        valor_total: total,
        estado: "nueva",
        enviado_whatsapp: false,
      });
    } catch {
      // Si falla el guardado en base de datos no bloqueamos el flujo del
      // cliente: la cotización igual se genera y se puede enviar.
    }

    setSending(false);
    setStep("success");
  };

  const shortMsg = vendor
    ? `Hola, soy ${name}. Te comparto mi cotización de pedido de Serena Home 🧾 (adjunto la imagen).`
    : "";
  const waUrl = vendor ? `https://wa.me/${vendor.phone}?text=${encodeURIComponent(shortMsg)}` : "#";

  const shareImage = async () => {
    if (!quoteBlob) return;
    const file = new File([quoteBlob], `cotizacion-${orderNo}.jpg`, { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: shortMsg, title: "Cotización Serena Home" });
      } catch {
        // cancelado por el usuario
      }
    } else {
      window.open(waUrl, "_blank");
    }
  };

  const downloadImage = () => {
    if (!quoteImgUrl) return;
    const a = document.createElement("a");
    a.href = quoteImgUrl;
    a.download = `cotizacion-${orderNo}.jpg`;
    a.click();
  };

  return (
    <>
      {step === "cart" && (
        <div className="fixed inset-0 z-[80] bg-[rgba(30,22,14,.5)] flex justify-end">
          <div className="bg-bg w-full max-w-[430px] h-full flex flex-col">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <h3 className="font-serif text-xl">Tu pedido</h3>
              <button onClick={() => setStep("closed")} className="text-2xl text-inkSoft">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <p className="text-center text-inkSoft py-16">Tu carrito está vacío.</p>
              ) : (
                cart.map((l) => (
                  <div key={l.id} className="flex gap-3 py-3.5 border-b border-line">
                    <img
                      src={`/images/${l.imageSlug}`}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      alt={l.name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14.5px] font-semibold">{l.name}</div>
                      <div className="text-xs text-inkSoft mt-0.5">
                        {[l.sizeLabel, l.color].filter(Boolean).join(" · ")}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <button
                          onClick={() => removeLine(l.id)}
                          className="text-xs text-terracottaDark underline"
                        >
                          Quitar
                        </button>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={l.qty}
                            onChange={(e) => setQty(l.id, Number(e.target.value))}
                            className="w-12 border border-line rounded px-1 py-0.5 text-sm text-center"
                          />
                          <strong>{fmtCOP(l.price * l.qty)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-5 border-t border-line bg-card">
                <div className="flex justify-between text-[15px] mb-3.5">
                  <span>Total</span>
                  <strong className="font-serif text-2xl">{fmtCOP(total)}</strong>
                </div>
                <button
                  onClick={goCheckout}
                  className="w-full bg-darkBtn text-white py-3.5 rounded-md font-bold hover:bg-terracotta"
                >
                  Continuar pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "vendor" && (
        <VendorPickerModal
          vendors={vendors}
          onClose={() => setStep("cart")}
          onPick={(v) => {
            setVendor(v);
            setStep("checkout");
          }}
        />
      )}

      {step === "checkout" && vendor && (
        <div className="fixed inset-0 z-[80] bg-[rgba(30,22,14,.5)] flex items-center justify-center p-5">
          <div className="bg-card w-full max-w-[440px] rounded-xl p-7 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-2xl mb-1.5">Datos para tu pedido</h3>
            <p className="text-[13.5px] text-inkSoft mb-5">
              Los usamos para preparar tu factura mayorista.
            </p>
            <div className="bg-bg border border-line rounded-lg px-3.5 py-3 flex items-center gap-2.5 mb-5 text-[13.5px]">
              <div className="w-8.5 h-8.5 w-[34px] h-[34px] rounded-full bg-terracotta text-white flex items-center justify-center font-serif">
                {vendor.name.charAt(0)}
              </div>
              <div>
                Tu pedido será atendido por
                <br />
                <strong>{vendor.name}</strong>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[12.5px] font-semibold mb-1.5">
                Nombre completo o razón social *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Hotel Las Palmas SAS"
                className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
              />
            </div>
            <div className="mb-4">
              <label className="block text-[12.5px] font-semibold mb-1.5">
                NIT o cédula (para facturar)
              </label>
              <input
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                placeholder="Ej: 900.123.456-7"
                className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
              />
            </div>
            <div className="mb-5">
              <label className="block text-[12.5px] font-semibold mb-1.5">Ciudad</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej: Bogotá"
                className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
              />
            </div>
            <button
              disabled={!name.trim() || sending}
              onClick={handleSend}
              className="w-full bg-darkBtn text-white py-3.5 rounded-md font-bold disabled:opacity-40"
            >
              {sending ? "Generando cotización..." : "Generar cotización"}
            </button>
            <button
              onClick={() => setStep("cart")}
              className="block mt-3.5 text-[12.5px] text-inkSoft underline mx-auto"
            >
              ← Volver al carrito
            </button>
          </div>
        </div>
      )}

      {step === "success" && vendor && (
        <div className="fixed inset-0 z-[80] bg-[rgba(30,22,14,.5)] flex items-center justify-center p-5">
          <div className="bg-card w-full max-w-[440px] rounded-xl p-7 max-h-[90vh] overflow-y-auto text-center">
            <div className="text-4xl mb-2">🧾</div>
            <h3 className="font-serif text-2xl mb-1.5">¡Tu cotización está lista!</h3>
            <p className="text-[13.5px] text-inkSoft mb-4">
              1) Guarda la imagen → 2) Se abre WhatsApp con <strong>{vendor.name}</strong> → 3)
              Adjúntala ahí.
            </p>
            {quoteImgUrl && (
              <img
                src={quoteImgUrl}
                alt="Cotización"
                className="w-full rounded-lg border border-line mb-2.5"
              />
            )}
            <button
              onClick={downloadImage}
              className="w-full bg-darkBtn text-white py-3.5 rounded-md font-bold mb-2.5"
            >
              ⬇ Descargar cotización (imagen)
            </button>
            <button
              onClick={shareImage}
              className="w-full bg-[#25D366] text-[#0b2313] py-3.5 rounded-md font-bold"
            >
              Compartir por WhatsApp
            </button>
            <p className="text-[11px] text-inkSoft mt-2">
              Si tu celular soporta compartir directo, la imagen ya sale adjunta. Si no, se abre
              WhatsApp con el chat listo y adjuntas la imagen descargada.
            </p>
            {OWNER_WHATSAPP && (
              <button
                onClick={() => {
                  const ownerMsg = `*(COPIA INTERNA)*\nAsesor(a): ${vendor.name}\nCliente: ${name}\nTotal: ${fmtCOP(total)}`;
                  window.open(
                    `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(ownerMsg + "\n\n(Adjunta la imagen que descargaste)")}`,
                    "_blank"
                  );
                }}
                className="block mt-3.5 text-[12.5px] text-inkSoft underline mx-auto"
              >
                Enviarme copia a mí (registro)
              </button>
            )}
            <button
              onClick={() => {
                clear();
                setStep("closed");
                setName("");
                setNit("");
                setCity("");
              }}
              className="block mt-2 text-[12.5px] text-inkSoft underline mx-auto"
            >
              Hacer otro pedido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

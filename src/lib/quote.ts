import type { CartLine, Vendor } from "./types";

/** Número de cotización con formato SH-YYYYMMDD-HHMM, igual al del catálogo original. */
export function buildQuoteNumber(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    "SH-" +
    now.getFullYear() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    "-" +
    pad(now.getHours()) +
    pad(now.getMinutes())
  );
}

const TERRA = "#bd6f52";
const INK = "#2c241c";
const INK_SOFT = "#6b6152";
const LINE = "#e6dac0";
const WHITE = "#ffffff";

/**
 * Dibuja la cotización en un <canvas> y devuelve un Blob JPEG — misma idea
 * visual que la del catálogo (Artifact) original: franja terracota con
 * logo, datos del cliente, tabla de productos, total y pie de página.
 */
export async function buildQuoteImage(opts: {
  orderNo: string;
  dateStr: string;
  vendor: Vendor;
  clientName: string;
  clientNit: string;
  clientCity: string;
  cart: CartLine[];
  logoSrc?: string; // data URL o /logo.png
}): Promise<{ blob: Blob; width: number; height: number }> {
  const { orderNo, dateStr, vendor, clientName, clientNit, clientCity, cart, logoSrc } = opts;

  const W = 900;
  const rowH = 74;
  const headerH = 150;
  const clientBoxH = 118;
  const tableHeadH = 40;
  const footH = 90;
  const H = headerH + clientBoxH + tableHeadH + rowH * cart.length + 70 + footH;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Fondo
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, H);

  // Encabezado terracota
  ctx.fillStyle = TERRA;
  ctx.fillRect(0, 0, W, headerH);
  ctx.textBaseline = "alphabetic";

  let textStartX = 40;
  const logoImg = logoSrc ? await loadImage(logoSrc) : null;
  if (logoImg) {
    const logoH = 88;
    const logoW = logoH * (logoImg.width / logoImg.height);
    ctx.drawImage(logoImg, 40, (headerH - logoH) / 2, logoW, logoH);
    textStartX = 40 + logoW + 18;
  } else {
    ctx.fillStyle = WHITE;
    ctx.font = "italic 700 42px Fraunces, serif";
    ctx.fillText("Serena Home", textStartX, 66);
  }
  ctx.font = '600 13px "Work Sans", sans-serif';
  ctx.fillStyle = "rgba(255,255,255,.88)";
  ctx.fillText("PREFORMA DE PEDIDO MAYORISTA", textStartX, logoImg ? headerH / 2 + 26 : 92);

  ctx.textAlign = "right";
  ctx.fillStyle = WHITE;
  ctx.font = "700 15px 'Work Sans', sans-serif";
  ctx.fillText("N.º " + orderNo, W - 40, 60);
  ctx.font = "500 12px 'Work Sans', sans-serif";
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.fillText(dateStr, W - 40, 82);
  ctx.textAlign = "left";

  // Bloque cliente / asesor
  let y = headerH + 30;
  ctx.fillStyle = INK;
  ctx.font = "600 13px 'Work Sans', sans-serif";
  ctx.fillText("CLIENTE", 40, y);
  ctx.font = "500 14px 'Work Sans', sans-serif";
  ctx.fillText(clientName, 40, y + 22);
  ctx.fillStyle = INK_SOFT;
  ctx.font = "400 12px 'Work Sans', sans-serif";
  ctx.fillText(
    [clientNit && `NIT/Cédula: ${clientNit}`, clientCity && `Ciudad: ${clientCity}`]
      .filter(Boolean)
      .join("   ·   "),
    40,
    y + 42
  );

  ctx.fillStyle = INK;
  ctx.font = "600 13px 'Work Sans', sans-serif";
  ctx.fillText("ASESOR(A)", W / 2 + 20, y);
  ctx.font = "500 14px 'Work Sans', sans-serif";
  ctx.fillText(vendor.name, W / 2 + 20, y + 22);
  ctx.fillStyle = INK_SOFT;
  ctx.font = "400 12px 'Work Sans', sans-serif";
  ctx.fillText(vendor.city || "", W / 2 + 20, y + 42);

  y = headerH + clientBoxH;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(W, y);
  ctx.stroke();

  // Tabla
  y += 28;
  ctx.fillStyle = INK_SOFT;
  ctx.font = "700 11px 'Work Sans', sans-serif";
  ctx.fillText("PRODUCTO", 40, y);
  ctx.fillText("MEDIDA / COLOR", 420, y);
  ctx.fillText("CANT.", 620, y);
  ctx.textAlign = "right";
  ctx.fillText("PRECIO", W - 40, y);
  ctx.textAlign = "left";

  y += 14;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(W - 40, y);
  ctx.stroke();

  let total = 0;
  for (const line of cart) {
    y += rowH - 20;
    ctx.fillStyle = INK;
    ctx.font = "600 14px 'Work Sans', sans-serif";
    wrapText(ctx, line.name, 40, y, 360, 18);
    ctx.font = "400 12.5px 'Work Sans', sans-serif";
    ctx.fillStyle = INK_SOFT;
    ctx.fillText([line.sizeLabel, line.color].filter(Boolean).join(" · "), 420, y);
    ctx.fillStyle = INK;
    ctx.fillText(String(line.qty), 620, y);
    ctx.textAlign = "right";
    ctx.fillText("$" + (line.price * line.qty).toLocaleString("es-CO"), W - 40, y);
    ctx.textAlign = "left";
    total += line.price * line.qty;

    y += 20;
    ctx.strokeStyle = "#f1e9d8";
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(W - 40, y);
    ctx.stroke();
  }

  // Total
  y += 46;
  ctx.fillStyle = TERRA;
  ctx.fillRect(0, y - 34, W, 60);
  ctx.fillStyle = WHITE;
  ctx.font = "700 15px 'Work Sans', sans-serif";
  ctx.fillText("TOTAL", 40, y);
  ctx.textAlign = "right";
  ctx.font = "700 22px 'Fraunces', serif";
  ctx.fillText("$" + total.toLocaleString("es-CO"), W - 40, y + 4);
  ctx.textAlign = "left";

  // Pie
  y += 60;
  ctx.fillStyle = INK_SOFT;
  ctx.font = "italic 400 11.5px 'Work Sans', sans-serif";
  ctx.fillText(
    "Cotización de referencia, sujeta a confirmación de disponibilidad. Precios en pesos colombianos (COP).",
    40,
    y + 20
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve({ blob: blob!, width: W, height: H }),
      "image/jpeg",
      0.92
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lines * lineHeight);
      line = w;
      lines++;
      if (lines > 1) break; // máximo 2 líneas por nombre de producto
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + lines * lineHeight);
}

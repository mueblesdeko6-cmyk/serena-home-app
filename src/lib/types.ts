export type ProductSize = [label: string, price: number];

export type Product = {
  id: string;
  name: string;
  cat: string;
  desc: string;
  colors: string[];
  sizes: ProductSize[];
  image_slug: string;
};

export type Vendor = {
  key: string;
  name: string;
  phone: string;
  city: string;
};

export type CartLine = {
  id: string; // productId-size-color
  productId: string;
  name: string;
  sizeLabel: string;
  color: string;
  price: number;
  qty: number;
  imageSlug: string;
};

export type QuoteStatus =
  | "nueva"
  | "contactado"
  | "confirmado"
  | "facturado"
  | "cancelado";

export type QuoteRow = {
  id: string;
  numero: string;
  fecha: string;
  hora: string;
  cliente_nombre: string;
  cliente_nit: string | null;
  cliente_ciudad: string | null;
  cliente_telefono: string | null;
  cliente_correo: string | null;
  asesor_origen: string | null;
  asesor_seleccionado: string | null;
  productos: CartLine[];
  cantidad_items: number;
  valor_total: number;
  estado: QuoteStatus;
  enviado_whatsapp: boolean;
  created_at: string;
};

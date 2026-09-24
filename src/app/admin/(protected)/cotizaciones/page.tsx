"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fmtCOP } from "@/lib/cart";
import type { QuoteRow, QuoteStatus } from "@/lib/types";
import vendorsData from "@/data/vendors.json";

const vendors = vendorsData as { key: string; name: string }[];
const STATUSES: QuoteStatus[] = ["nueva", "contactado", "confirmado", "facturado", "cancelado"];

export default function CotizacionesPage() {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  // Rol de quien mira esta pantalla. Un 'vendedor' solo puede ver y mover
  // sus propias cotizaciones (además reforzado por RLS en la base de
  // datos), así que aquí solo ajustamos la interfaz: se oculta el filtro
  // de asesor y el link al dashboard general.
  const [myRole, setMyRole] = useState<"admin" | "vendedor" | null>(null);
  const [myVendorKey, setMyVendorKey] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, vendor_key")
        .eq("id", session.user.id)
        .single();
      if (profile) {
        setMyRole(profile.role as "admin" | "vendedor");
        setMyVendorKey(profile.vendor_key);
        if (profile.role === "vendedor" && profile.vendor_key) {
          setVendorFilter(profile.vendor_key);
        }
      }
    });
  }, []);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("quotes").select("*").order("created_at", { ascending: false });
    if (from) query = query.gte("fecha", from);
    if (to) query = query.lte("fecha", to);
    if (vendorFilter) query = query.eq("asesor_seleccionado", vendorFilter);
    if (statusFilter) query = query.eq("estado", statusFilter);
    const { data } = await query.returns<QuoteRow[]>();
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, vendorFilter, statusFilter]);

  const isVendedor = myRole === "vendedor";

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.cliente_nombre.toLowerCase().includes(search.toLowerCase()) ||
      r.numero.toLowerCase().includes(search.toLowerCase()) ||
      (r.cliente_ciudad || "").toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, estado: QuoteStatus) => {
    const supabase = createClient();
    await supabase.from("quotes").update({ estado }).eq("id", id);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, estado } : r)));
  };

  const exportCsv = () => {
    const headers = [
      "Número",
      "Fecha",
      "Hora",
      "Cliente",
      "NIT/Cédula",
      "Ciudad",
      "Asesor origen",
      "Asesor seleccionado",
      "Cantidad items",
      "Valor total",
      "Estado",
    ];
    const lines = filtered.map((r) =>
      [
        r.numero,
        r.fecha,
        r.hora,
        r.cliente_nombre,
        r.cliente_nit || "",
        r.cliente_ciudad || "",
        r.asesor_origen || "",
        r.asesor_seleccionado || "",
        r.cantidad_items,
        r.valor_total,
        r.estado,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cotizaciones-serena-home-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl">{isVendedor ? "Mis cotizaciones" : "Cotizaciones"}</h1>
        <div className="flex gap-3">
          {!isVendedor && (
            <Link href="/admin/dashboard" className="text-sm underline text-inkSoft">
              ← Dashboard
            </Link>
          )}
          <button
            onClick={exportCsv}
            className="text-sm bg-darkBtn text-white px-4 py-2 rounded-md"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-2 gap-3 mb-5 ${isVendedor ? "md:grid-cols-5" : "md:grid-cols-6"}`}>
        <Field label="Desde">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input" />
        </Field>
        <Field label="Hasta">
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input" />
        </Field>
        {!isVendedor && (
          <Field label="Asesor">
            <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="input">
              <option value="">Todos</option>
              {vendors.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Estado">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
            <option value="">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Buscar cliente / número / ciudad">
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input" />
        </Field>
      </div>

      {loading ? (
        <p className="text-inkSoft">Cargando...</p>
      ) : (
        <div className="overflow-x-auto bg-card border border-line rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-bg text-inkSoft text-xs uppercase">
              <tr>
                <th className="text-left px-3 py-2.5">Número</th>
                <th className="text-left px-3 py-2.5">Fecha</th>
                <th className="text-left px-3 py-2.5">Cliente</th>
                <th className="text-left px-3 py-2.5">Ciudad</th>
                <th className="text-left px-3 py-2.5">Asesor</th>
                <th className="text-right px-3 py-2.5">Total</th>
                <th className="text-left px-3 py-2.5">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-3 py-2.5 font-mono text-xs">{r.numero}</td>
                  <td className="px-3 py-2.5">
                    {r.fecha} {r.hora?.slice(0, 5)}
                  </td>
                  <td className="px-3 py-2.5">{r.cliente_nombre}</td>
                  <td className="px-3 py-2.5">{r.cliente_ciudad || "—"}</td>
                  <td className="px-3 py-2.5">
                    {vendors.find((v) => v.key === r.asesor_seleccionado)?.name || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fmtCOP(Number(r.valor_total))}</td>
                  <td className="px-3 py-2.5">
                    <select
                      value={r.estado}
                      onChange={(e) => updateStatus(r.id, e.target.value as QuoteStatus)}
                      className="border border-line rounded px-2 py-1 text-xs bg-white"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-inkSoft py-10">
                    No hay cotizaciones con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style jsx global>{`
        .input {
          border: 1px solid #e6dac0;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13px;
          background: white;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-inkSoft mb-1">{label}</span>
      {children}
    </label>
  );
}

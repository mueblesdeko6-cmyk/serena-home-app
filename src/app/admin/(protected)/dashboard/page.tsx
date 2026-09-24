"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fmtCOP } from "@/lib/cart";
import type { QuoteRow } from "@/lib/types";

export default function DashboardPage() {
  const [todayCount, setTodayCount] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [avgTicket, setAvgTicket] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: monthQuotes } = await supabase
        .from("quotes")
        .select("valor_total, estado, created_at")
        .gte("created_at", monthStart)
        .returns<Pick<QuoteRow, "valor_total" | "estado" | "created_at">[]>();

      const quotes = monthQuotes || [];
      const today = quotes.filter((q) => q.created_at >= todayStart);
      const confirmed = quotes.filter((q) => q.estado === "confirmado" || q.estado === "facturado");

      setTodayCount(today.length);
      setTodayTotal(today.reduce((s, q) => s + Number(q.valor_total), 0));
      setMonthCount(quotes.length);
      setMonthTotal(quotes.reduce((s, q) => s + Number(q.valor_total), 0));
      setConfirmedCount(confirmed.length);
      setAvgTicket(quotes.length ? quotes.reduce((s, q) => s + Number(q.valor_total), 0) / quotes.length : 0);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-serif text-xl text-terracottaDark">Serena Home</div>
          <h1 className="font-serif text-2xl">Panel de administración</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/cotizaciones" className="text-sm underline text-inkSoft">
            Ver cotizaciones
          </Link>
          <Link href="/" className="text-sm underline text-inkSoft">
            Ir al catálogo
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-inkSoft">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Kpi label="Cotizaciones hoy" value={String(todayCount)} />
          <Kpi label="Valor hoy" value={fmtCOP(todayTotal)} />
          <Kpi label="Cotizaciones este mes" value={String(monthCount)} />
          <Kpi label="Valor este mes" value={fmtCOP(monthTotal)} />
          <Kpi label="Ventas confirmadas (mes)" value={String(confirmedCount)} />
        </div>
      )}

      <div className="mt-6 bg-card border border-line rounded-lg p-5">
        <div className="text-sm text-inkSoft">Ticket promedio (mes)</div>
        <div className="font-serif text-3xl mt-1">{fmtCOP(Math.round(avgTicket))}</div>
      </div>

      <div className="mt-8 text-xs text-inkSoft">
        Embudo de conversión completo (Visitas → Productos agregados → Pedidos → Cotizaciones →
        WhatsApp → Ventas) requiere medir eventos de navegación además de cotizaciones — queda
        marcado como siguiente paso: se puede agregar con una tabla `events` y Vercel/Supabase
        Analytics (free tier) sin costo adicional.
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-line rounded-lg p-4">
      <div className="text-xs text-inkSoft">{label}</div>
      <div className="font-serif text-2xl mt-1">{value}</div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // El login vive fuera de este guard (ver src/middleware.ts), así que si
  // llegamos aquí sin sesión, algo raro pasó — mandamos a login.
  if (!session) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, vendor_key")
    .eq("id", session.user.id)
    .single();

  // Roles permitidos: 'admin' (ve todo) y 'vendedor' (solo sus propias
  // cotizaciones, protegido además por las políticas RLS en la base de
  // datos — aunque alguien manipulara la app, la consulta a Supabase
  // solo devuelve sus propias filas).
  const isAdmin = profile?.role === "admin";
  const isVendedor = profile?.role === "vendedor" && !!profile?.vendor_key;

  if (!profile || (!isAdmin && !isVendedor)) {
    const pendingVendedor = profile?.role === "vendedor" && !profile?.vendor_key;
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-5 text-center">
        <div>
          <h1 className="font-serif text-2xl mb-2">
            {pendingVendedor ? "Cuenta creada, falta activarla" : "Acceso restringido"}
          </h1>
          <p className="text-inkSoft text-sm max-w-sm">
            {pendingVendedor
              ? `Tu cuenta (${profile?.email || session.user.email}) ya existe, pero todavía no está vinculada a tu perfil de asesora. Pide a la administradora que la active desde Supabase.`
              : `Tu cuenta (${profile?.email || session.user.email}) no tiene permisos. Pide a la administradora que te dé acceso, o revisa el README para activar tu propia cuenta.`}
          </p>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-bg">{children}</div>;
}

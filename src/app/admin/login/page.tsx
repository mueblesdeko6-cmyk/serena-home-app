"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup") {
      setError(
        "Cuenta creada. Por defecto no tiene permisos de administrador — sigue las instrucciones del README (tabla profiles) para activarla, luego inicia sesión."
      );
      setMode("login");
      return;
    }
    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-5">
      <form onSubmit={submit} className="bg-card border border-line rounded-xl p-8 w-full max-w-[380px]">
        <div className="font-serif text-xl text-terracottaDark mb-1">Serena Home</div>
        <h1 className="font-serif text-2xl mb-5">
          {mode === "login" ? "Panel de administración" : "Crear cuenta"}
        </h1>
        {error && (
          <div className="text-[12.5px] text-terracottaDark bg-[#fbf1e8] border border-line rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <div className="mb-3.5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
          />
        </div>
        <div className="mb-5">
          <label className="block text-[12.5px] font-semibold mb-1.5">Contraseña</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-line rounded-md px-3 py-2.5 text-sm"
          />
        </div>
        <button
          disabled={loading}
          className="w-full bg-darkBtn text-white py-3 rounded-md font-bold disabled:opacity-50"
        >
          {loading ? "Un momento..." : mode === "login" ? "Entrar" : "Crear cuenta"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="block mt-3.5 text-[12.5px] text-inkSoft underline mx-auto"
        >
          {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
        </button>
      </form>
    </div>
  );
}

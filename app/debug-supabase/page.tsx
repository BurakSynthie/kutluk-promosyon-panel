"use client";

import { useState } from "react";

export default function DebugSupabasePage() {
  const [result, setResult] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  async function testConnection() {
    setResult("Test ediliyor...");

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabaseKey || "",
        },
      });

      const text = await response.text();

      setResult(
        JSON.stringify(
          {
            ok: response.ok,
            status: response.status,
            url: supabaseUrl,
            keyStart: supabaseKey?.slice(0, 18),
            response: text.slice(0, 600),
          },
          null,
          2
        )
      );
    } catch (error: any) {
      setResult(
        JSON.stringify(
          {
            url: supabaseUrl,
            keyStart: supabaseKey?.slice(0, 18),
            errorName: error?.name,
            errorMessage: error?.message,
          },
          null,
          2
        )
      );
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <h1 className="text-2xl font-black">Supabase Debug</h1>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
        <p className="text-sm text-white/60">URL</p>
        <p className="mt-1 font-bold">{supabaseUrl || "YOK"}</p>

        <p className="mt-4 text-sm text-white/60">Key başlangıcı</p>
        <p className="mt-1 font-bold">{supabaseKey?.slice(0, 25) || "YOK"}</p>
      </div>

      <button
        onClick={testConnection}
        className="mt-5 rounded-2xl bg-cyan-500 px-5 py-3 font-black text-black"
      >
        Supabase Bağlantısını Test Et
      </button>

      <pre className="mt-5 overflow-auto rounded-2xl border border-white/10 bg-white/10 p-4 text-xs leading-6 text-white/80">
        {result || "Henüz test edilmedi."}
      </pre>
    </main>
  );
}
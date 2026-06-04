"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Store, LogIn, AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("demo") === "1") {
      iniciarDemo();
    }
  }, []);

  const iniciarDemo = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setDemoLoading(false);
        return;
      }
      setEmail(data.email);
      setPassword(data.password);
      const result = await signIn(data.email, data.password);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Error al conectar con el servidor");
    }
    setDemoLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }
  };

  const isBusy = loading || demoLoading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Control de Inventario
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Inicia sesión para continuar
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inicio
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors dark:bg-gray-700 dark:text-white"
              placeholder="admin@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors dark:bg-gray-700 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                Iniciar Sesión
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-800 px-2 text-gray-400">
                o
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={iniciarDemo}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {demoLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Probar Demo Gratis
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

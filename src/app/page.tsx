"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Store, Package, TrendingUp, BarChart3, Shield,
  ArrowRight, Star, CheckCircle, Menu, X, ChevronRight,
  Sun, Moon
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Package,
    title: "Control de Stock",
    desc: "Gestiona inventarios en múltiples tiendas con actualizaciones en tiempo real.",
  },
  {
    icon: TrendingUp,
    title: "Ventas y Transferencias",
    desc: "Registra ventas y transfiere stock entre sucursales de forma atómica.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Financiero",
    desc: "KPIs, gráficos de rentabilidad, márgenes y valor de inventario.",
  },
  {
    icon: Shield,
    title: "Roles y Permisos",
    desc: "Administradores con control total y usuarios limitados a su tienda.",
  },
];

const testimonials = [
  { name: "María G.", role: "Dueña de tienda", text: "Reduje mis pérdidas por inventario en un 40% en el primer mes." },
  { name: "Carlos R.", role: "Gerente de operaciones", text: "Las transferencias entre tiendas ahora son instantáneas y sin errores." },
  { name: "Ana L.", role: "Contadora", text: "Los reportes financieros me ahorran horas de trabajo cada semana." },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
    const isDark = localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
  }, [loading, user, router]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleDark = () => {
    setDark(!dark);
    localStorage.setItem("theme", !dark ? "dark" : "light");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (user) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <div className={`${dark ? "dark" : ""}`}>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">

        {/* NAV */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xl">
              <Store className="h-6 w-6 text-primary-600" />
              <span className="bg-gradient-to-r from-primary-600 to-blue-500 bg-clip-text text-transparent">InventarioApp</span>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollTo("features")} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Características</button>
              <button onClick={() => scrollTo("pricing")} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Precios</button>
              <button onClick={() => scrollTo("testimonials")} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Testimonios</button>
              <button onClick={toggleDark} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link href="/login" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Iniciar Sesión</Link>
              <Link
                href="/login?demo=1"
                className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors shadow-lg shadow-primary-600/25"
              >
                Probar Demo
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-3">
              <button onClick={() => scrollTo("features")} className="block w-full text-left text-sm py-2 text-gray-600 dark:text-gray-400">Características</button>
              <button onClick={() => scrollTo("pricing")} className="block w-full text-left text-sm py-2 text-gray-600 dark:text-gray-400">Precios</button>
              <button onClick={() => scrollTo("testimonials")} className="block w-full text-left text-sm py-2 text-gray-600 dark:text-gray-400">Testimonios</button>
              <button onClick={toggleDark} className="flex items-center gap-2 text-sm py-2 text-gray-600 dark:text-gray-400">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {dark ? "Modo Claro" : "Modo Oscuro"}
              </button>
              <Link href="/login" className="block text-sm font-medium py-2">Iniciar Sesión</Link>
              <Link
                href="/login?demo=1"
                className="block text-center bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Probar Demo Gratis
              </Link>
            </div>
          )}
        </nav>

        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
          <div className="inline-flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Star className="h-3.5 w-3.5" />
            Sistema de Control de Inventario
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Controla tu inventario
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-blue-500 bg-clip-text text-transparent">
              en tiempo real
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            Gestiona stock en múltiples tiendas, registra ventas, transfiere productos y
            obtén reportes financieros al instante.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?demo=1"
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-primary-600/30 hover:shadow-primary-600/40 text-lg"
            >
              Probar Demo Gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              onClick={() => scrollTo("features")}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium px-8 py-3.5 rounded-xl transition-colors text-lg"
            >
              Ver Características
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto">
            {[["+500", "Productos"], ["+3", "Tiendas"], ["99.9%", "Uptime"], ["24/7", "Soporte"]].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-3xl font-bold text-primary-600">{val}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Todo lo que necesitas</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">
              Un sistema completo para la gestión de inventarios con todo incluido.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mb-4">
                    <f.icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
            <div className="space-y-8">
              {[
                { step: "1", title: "Crea tus tiendas y productos", desc: "Registra las sucursales y el catálogo de productos con precios, categorías y marcas." },
                { step: "2", title: "Gestiona el stock", desc: "Realiza entradas, salidas y transferencias entre tiendas al instante." },
                { step: "3", title: "Analiza resultados", desc: "Revisa dashboards, KPIs financieros y exporta reportes en PDF o Excel." },
              ].map((s) => (
                <div key={s.step} className="flex gap-5 items-start">
                  <div className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{s.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="bg-gray-50 dark:bg-gray-900 py-20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">Precios simples</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-12">Sin sorpresas. Elige el plan que mejor se ajuste.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Básico", price: "Gratis", users: "1 tienda", features: ["Hasta 50 productos", "Dashboard básico", "Soporte email"] },
                { name: "Profesional", price: "S/ 49", users: "3 tiendas", features: ["Productos ilimitados", "Reportes PDF/Excel", "Transferencias", "Soporte prioritario"], popular: true },
                { name: "Empresarial", price: "S/ 99", users: "10+ tiendas", features: ["Todo lo de Profesional", "API pública", "Múltiples usuarios", "Soporte 24/7", "Onboarding dedicado"] },
              ].map((p) => (
                <div
                  key={p.name}
                  className={`bg-white dark:bg-gray-800 rounded-xl border ${p.popular ? "border-primary-500 ring-2 ring-primary-500/20" : "border-gray-200 dark:border-gray-700"} p-6 relative`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Más popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{p.users}</p>
                  <div className="text-3xl font-bold mb-6">
                    {p.price}
                    {p.price !== "Gratis" && <span className="text-base font-normal text-gray-500">/mes</span>}
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.price === "Gratis" ? "/login?demo=1" : "/login?demo=1"}
                    className={`block text-center font-medium py-2.5 px-4 rounded-lg transition-colors ${
                      p.popular
                        ? "bg-primary-600 hover:bg-primary-700 text-white"
                        : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {p.price === "Gratis" ? "Comenzar" : "Contactar"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-20">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Lo que dicen nuestros usuarios</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-primary-600 to-blue-600 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">¿Listo para empezar?</h2>
            <p className="text-primary-100 mb-8 text-lg">
              Prueba el sistema de forma gratuita. Sin compromisos, sin tarjeta de crédito.
            </p>
            <Link
              href="/login?demo=1"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-medium px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-colors text-lg shadow-xl"
            >
              Probar Demo Gratis
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-950 text-gray-400 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 font-bold text-lg text-white">
                <Store className="h-5 w-5 text-primary-500" />
                InventarioApp
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span>Docs</span>
                <span>Términos</span>
                <span>Privacidad</span>
                <span>Contacto</span>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm">
              &copy; {new Date().getFullYear()} InventarioApp. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

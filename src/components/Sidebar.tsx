"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  ArrowLeftRight,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  LogOut,
  Store,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kardex", label: "Kardex", icon: ClipboardList },
  { href: "/transferencias", label: "Transferencias", icon: ArrowLeftRight },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/finanzas", label: "Finanzas", icon: BarChart3 },
  { href: "/productos", label: "Productos", icon: Package },
];

const adminItems = [
  { href: "/usuarios", label: "Usuarios", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { perfil, signOut, esAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const tiendaNombre = perfil?.tienda_id
    ? perfil.tienda_id === 1 ? "Abancay" : perfil.tienda_id === 2 ? "Gamarra" : "Centro"
    : null;

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
      active
        ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium shadow-sm"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
    }`;

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
              <Store className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white">Inventario</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">Control de Stock</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {perfil && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{perfil.nombre_completo}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                perfil.rol === "admin"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
              }`}>
                {perfil.rol === "admin" ? "Admin" : "Tienda"}
              </span>
              {tiendaNombre && <span className="text-[10px] text-gray-400">{tiendaNombre}</span>}
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass(pathname === item.href)}>
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}

        {esAdmin && (
          <>
            <div className="pt-4 pb-1">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3">Administración</p>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass(pathname === item.href)}>
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <button onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 w-full transition-colors">
          {theme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-gray-500" />}
          {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
        </button>
        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 w-full transition-colors">
          <LogOut className="h-4.5 w-4.5" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        fixed lg:sticky top-0 left-0 z-40
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        min-h-screen flex flex-col
        transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {sidebarContent}
      </aside>
    </>
  );
}

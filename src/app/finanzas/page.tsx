"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { obtenerIndicadoresFinancieros, obtenerMovimientosFinancieros } from "@/lib/api";
import { IndicadoresFinancieros, Tienda } from "@/lib/types";
import { obtenerTiendas } from "@/lib/api";
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3,
  FileText, Wallet, PieChart as PieChartIcon
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function Soles(n: number) {
  return `S/ ${n.toFixed(2)}`;
}

export default function FinanzasPage() {
  const { perfil, esAdmin } = useAuth();
  const [data, setData] = useState<IndicadoresFinancieros | null>(null);
  const [movimientosMes, setMovimientosMes] = useState<any[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [tiendaFiltro, setTiendaFiltro] = useState<number | undefined>(perfil?.tienda_id ?? undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfil && !esAdmin) setTiendaFiltro(perfil.tienda_id ?? undefined);
  }, [perfil, esAdmin]);

  useEffect(() => {
    cargarDatos();
  }, [tiendaFiltro]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [fin, movs, ts] = await Promise.all([
        obtenerIndicadoresFinancieros(tiendaFiltro),
        obtenerMovimientosFinancieros(tiendaFiltro),
        obtenerTiendas(),
      ]);
      setData(fin);
      setMovimientosMes(movs);
      setTiendas(ts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const indicadores = [
    { label: "Valor Inventario (Costo)", valor: data?.valor_inventario_costo ?? 0, icon: TrendingDown, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { label: "Valor Inventario (Venta)", valor: data?.valor_inventario_venta ?? 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/30" },
    { label: "Margen Potencial Total", valor: data?.margen_potencial ?? 0, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/30" },
    { label: "Utilidad del Mes", valor: data?.utilidad_mes ?? 0, icon: Wallet, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
  ];

  const pieData = data?.rentabilidad_productos.slice(0, 6).map((r) => ({
    name: r.nombre,
    value: r.margen_total,
  })) ?? [];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finanzas</h1>
          </div>
          {esAdmin && (
            <select value={tiendaFiltro ?? ""} onChange={(e) => setTiendaFiltro(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white">
              <option value="">Todas las tiendas</option>
              {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {indicadores.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${card.bg}`}><Icon className={`h-5 w-5 ${card.color}`} /></div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className={`text-xl font-bold ${card.valor >= 0 ? "text-gray-900 dark:text-white" : "text-red-600"}`}>
                      {Soles(card.valor)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Ingresos vs Egresos por Mes</h3>
                {movimientosMes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={movimientosMes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="mes" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => `S/${v}`} />
                      <Tooltip formatter={(v: number) => Soles(v)} />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="egresos" name="Egresos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-12">Sin datos financieros</p>
                )}
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Rentabilidad por Producto (Top 6)</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
                        {pieData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip formatter={(v: number) => Soles(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-12">Sin datos de rentabilidad</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Rentabilidad por Producto</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900">
                      <th className="px-5 py-3 font-medium">Producto</th>
                      <th className="px-5 py-3 font-medium">SKU</th>
                      <th className="px-5 py-3 font-medium">Vendidos</th>
                      <th className="px-5 py-3 font-medium">P. Compra</th>
                      <th className="px-5 py-3 font-medium">P. Venta</th>
                      <th className="px-5 py-3 font-medium">Margen Unit.</th>
                      <th className="px-5 py-3 font-medium">Margen Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.rentabilidad_productos.map((r) => (
                      <tr key={r.producto_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{r.nombre}</td>
                        <td className="px-5 py-3 text-gray-500 font-mono text-xs">{r.sku}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{r.cantidad_vendida}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{Soles(r.precio_compra)}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{Soles(r.precio_venta)}</td>
                        <td className={`px-5 py-3 font-medium ${r.margen_unitario >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {Soles(r.margen_unitario)}
                        </td>
                        <td className={`px-5 py-3 font-medium ${r.margen_total >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {Soles(r.margen_total)}
                        </td>
                      </tr>
                    ))}
                    {(!data?.rentabilidad_productos || data.rentabilidad_productos.length === 0) && (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Sin datos de ventas</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}

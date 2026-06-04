"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { obtenerStock, obtenerTiendas } from "@/lib/api";
import { Stock, Tienda } from "@/lib/types";
import {
  Warehouse, Search, Filter, FileSpreadsheet, FileText, AlertTriangle,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function StockPage() {
  const { perfil, esAdmin } = useAuth();
  const [stock, setStock] = useState<Stock[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [tiendaFiltro, setTiendaFiltro] = useState<number | undefined>(perfil?.tienda_id ?? undefined);
  const [soloAlertas, setSoloAlertas] = useState(false);

  useEffect(() => {
    if (perfil && !esAdmin) setTiendaFiltro(perfil.tienda_id ?? undefined);
  }, [perfil, esAdmin]);

  useEffect(() => {
    cargarDatos();
  }, [tiendaFiltro]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [stockData, tiendasData] = await Promise.all([
        obtenerStock(tiendaFiltro),
        obtenerTiendas(),
      ]);
      setStock(stockData);
      setTiendas(tiendasData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtrados = stock.filter((s) => {
    const p = s.productos;
    const coincideBusqueda = !busqueda ||
      p?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p?.sku?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p?.categoria?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideAlerta = !soloAlertas || (s.cantidad <= (p?.stock_minimo ?? 0) && (p?.stock_minimo ?? 0) > 0);
    return coincideBusqueda && coincideAlerta;
  });

  const exportToExcel = () => {
    const data = filtrados.map((s) => ({
      Producto: s.productos?.nombre ?? "—",
      SKU: s.productos?.sku ?? "—",
      Categoría: s.productos?.categoria ?? "—",
      Tienda: s.tiendas?.nombre ?? "—",
      Stock: s.cantidad,
      "Stock Mínimo": s.productos?.stock_minimo ?? 0,
      "P. Venta": s.productos?.precio_venta ?? 0,
      "Valor Total": (s.productos?.precio_venta ?? 0) * s.cantidad,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock");
    XLSX.writeFile(wb, `stock_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Warehouse className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock</h1>
          </div>
          <div className="flex items-center gap-2">
            {esAdmin && (
              <select value={tiendaFiltro ?? ""} onChange={(e) => setTiendaFiltro(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white">
                <option value="">Todas las tiendas</option>
                {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
              </select>
            )}
            <button onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <FileSpreadsheet className="h-4 w-4" /> Excel
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto, SKU o categoría..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white" />
          </div>
          <button onClick={() => setSoloAlertas(!soloAlertas)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              soloAlertas
                ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}>
            <AlertTriangle className="h-4 w-4" />
            Solo alertas
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900">
                    <th className="px-5 py-3 font-medium">Producto</th>
                    <th className="px-5 py-3 font-medium">SKU</th>
                    <th className="px-5 py-3 font-medium">Categoría</th>
                    <th className="px-5 py-3 font-medium">Tienda</th>
                    <th className="px-5 py-3 font-medium">Stock</th>
                    <th className="px-5 py-3 font-medium">Stock Mín</th>
                    <th className="px-5 py-3 font-medium">P. Venta</th>
                    <th className="px-5 py-3 font-medium">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((s) => {
                    const bajo = s.cantidad <= (s.productos?.stock_minimo ?? 0) && (s.productos?.stock_minimo ?? 0) > 0;
                    return (
                      <tr key={s.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${bajo ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{s.productos?.nombre ?? "—"}</td>
                        <td className="px-5 py-3 font-mono text-xs text-gray-500">{s.productos?.sku ?? "—"}</td>
                        <td className="px-5 py-3">{s.productos?.categoria ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">{s.productos.categoria}</span>
                        ) : "—"}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{s.tiendas?.nombre ?? "—"}</td>
                        <td className={`px-5 py-3 font-semibold ${bajo ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
                          {s.cantidad}
                          {bajo && <AlertTriangle className="inline h-3 w-3 ml-1 text-red-500" />}
                        </td>
                        <td className="px-5 py-3 text-gray-500">{s.productos?.stock_minimo ?? 0}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                          {s.productos?.precio_venta ? `S/ ${s.productos.precio_venta.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                          {s.productos?.precio_venta ? `S/ ${((s.productos.precio_venta) * s.cantidad).toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {filtrados.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                      <Warehouse className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No hay stock disponible
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
              {filtrados.length} de {stock.length} productos con stock
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

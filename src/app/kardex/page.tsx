"use client";

import { useEffect, useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { obtenerKardex, obtenerTiendas, registrarEntrada } from "@/lib/api";
import { Kardex, Tienda } from "@/lib/types";
import {
  Search, Filter, Plus, ClipboardList, Download,
  CalendarDays, FileSpreadsheet
} from "lucide-react";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

type ToastType = { message: string; type: "success" | "error" };

export default function KardexPage() {
  const { perfil, user, esAdmin } = useAuth();
  const [movimientos, setMovimientos] = useState<Kardex[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [tiendaFiltro, setTiendaFiltro] = useState<number | undefined>(
    perfil?.tienda_id ?? undefined
  );
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [toast, setToast] = useState<ToastType | null>(null);

  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [entradaProducto, setEntradaProducto] = useState("");
  const [entradaCantidad, setEntradaCantidad] = useState("");
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    if (perfil && !esAdmin) {
      setTiendaFiltro(perfil.tienda_id ?? undefined);
    }
  }, [perfil, esAdmin]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [kardexData, tiendasData] = await Promise.all([
        obtenerKardex(tiendaFiltro, 500, fechaDesde || undefined, fechaHasta || undefined),
        obtenerTiendas(),
      ]);
      setMovimientos(kardexData);
      setTiendas(tiendasData);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, [tiendaFiltro, fechaDesde, fechaHasta]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    const fetchProductos = async () => {
      const { data } = await supabase.from("productos").select("*").order("nombre");
      setProductos(data ?? []);
    };
    fetchProductos();
  }, []);

  const movimientosFiltrados = movimientos.filter((mov) => {
    const coincideBusqueda =
      !busqueda ||
      mov.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      mov.productos?.sku?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTipo = !filtroTipo || mov.tipo_movimiento === filtroTipo;
    return coincideBusqueda && coincideTipo;
  });

  const exportToExcel = () => {
    const data = movimientosFiltrados.map((m) => ({
      Fecha: new Date(m.fecha_hora).toLocaleString("es-PE"),
      Producto: m.productos?.nombre ?? "—",
      SKU: m.productos?.sku ?? "—",
      Tipo: m.tipo_movimiento,
      Cantidad: m.cantidad,
      Origen: m.tienda_origen?.nombre ?? "—",
      Destino: m.tienda_destino?.nombre ?? "—",
      Usuario: m.perfiles?.nombre_completo ?? "—",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Kardex");

    const colWidths = [
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `kardex_${new Date().toISOString().split("T")[0]}.xlsx`);
    setToast({ message: "Excel exportado exitosamente", type: "success" });
  };

  const handleEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tiendaFiltro) return;

    try {
      const result = await registrarEntrada(
        Number(entradaProducto),
        tiendaFiltro,
        Number(entradaCantidad),
        user.id
      );

      if (result.exito) {
        setToast({ message: "Entrada registrada exitosamente", type: "success" });
        setShowEntradaModal(false);
        setEntradaProducto("");
        setEntradaCantidad("");
        cargarDatos();
      } else {
        setToast({ message: result.error ?? "Error al registrar entrada", type: "error" });
      }
    } catch (error: any) {
      setToast({ message: error.message ?? "Error inesperado", type: "error" });
    }
  };

  return (
    <ProtectedRoute>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kardex</h1>
          </div>
          <div className="flex items-center gap-2">
            {esAdmin && (
              <select
                value={tiendaFiltro ?? ""}
                onChange={(e) => setTiendaFiltro(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white"
              >
                <option value="">Todas las tiendas</option>
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            )}
            <button onClick={exportToExcel}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </button>
            <button onClick={() => setShowEntradaModal(true)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4" />
              Nueva Entrada
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por producto o SKU..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
              className="pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none bg-white dark:bg-gray-800 dark:text-white">
              <option value="">Todos los tipos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SALIDA">Salidas</option>
              <option value="TRANSFERENCIA">Transferencias</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white" />
            <span className="text-gray-400 text-sm">a</span>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                    <th className="px-5 py-3 font-medium">Fecha/Hora</th>
                    <th className="px-5 py-3 font-medium">Producto</th>
                    <th className="px-5 py-3 font-medium">SKU</th>
                    <th className="px-5 py-3 font-medium">Tipo</th>
                    <th className="px-5 py-3 font-medium">Cantidad</th>
                    <th className="px-5 py-3 font-medium">Origen</th>
                    <th className="px-5 py-3 font-medium">Destino</th>
                    <th className="px-5 py-3 font-medium">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.map((mov) => (
                    <tr key={mov.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs">
                        {new Date(mov.fecha_hora).toLocaleString("es-PE")}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                        {mov.productos?.nombre ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-500 font-mono text-xs">
                        {mov.productos?.sku ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          mov.tipo_movimiento === "ENTRADA"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                            : mov.tipo_movimiento === "SALIDA"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                        }`}>
                          {mov.tipo_movimiento}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">{mov.cantidad}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{mov.tienda_origen?.nombre ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{mov.tienda_destino?.nombre ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{mov.perfiles?.nombre_completo ?? "—"}</td>
                    </tr>
                  ))}
                  {movimientosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-gray-400">
                        <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No se encontraron movimientos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
              Mostrando {movimientosFiltrados.length} de {movimientos.length} movimientos
            </div>
          </div>
        )}
      </div>

      {showEntradaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Registrar Entrada de Stock
            </h2>
            <form onSubmit={handleEntrada} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producto</label>
                <select value={entradaProducto} onChange={(e) => setEntradaProducto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" required>
                  <option value="">Seleccionar producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                <input type="number" min="1" value={entradaCantidad} onChange={(e) => setEntradaCantidad(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" required />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEntradaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

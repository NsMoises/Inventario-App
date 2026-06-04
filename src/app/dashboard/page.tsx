"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import {
  obtenerDashboardKPI,
  obtenerTiendas,
  obtenerKardex,
  obtenerStock,
  obtenerIndicadoresFinancieros,
} from "@/lib/api";
import { DashboardKPI, Kardex, Tienda, Stock, IndicadoresFinancieros } from "@/lib/types";
import { exportarReporteDashboard, exportarReporteStock } from "@/lib/reportes";
import {
  TrendingUp,
  PackagePlus,
  ArrowLeftRight,
  ShoppingCart,
  CalendarClock,
  FileText,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

export default function DashboardPage() {
  const { perfil, esAdmin } = useAuth();
  const [kpi, setKpi] = useState<DashboardKPI>({
    total_ventas: 0,
    total_entradas: 0,
    total_transferencias: 0,
    cantidad_ventas: 0,
    cantidad_entradas: 0,
    cantidad_transferencias: 0,
  });
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [tiendaFiltro, setTiendaFiltro] = useState<number | undefined>(
    perfil?.tienda_id ?? undefined
  );
  const [movimientos, setMovimientos] = useState<Kardex[]>([]);
  const [stockAlertas, setStockAlertas] = useState<Stock[]>([]);
  const [financieros, setFinancieros] = useState<IndicadoresFinancieros | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfil && !esAdmin) {
      setTiendaFiltro(perfil.tienda_id ?? undefined);
    }
  }, [perfil, esAdmin]);

  useEffect(() => {
    cargarDatos();
  }, [tiendaFiltro]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [kpiData, tiendasData, kardexData, stockData, finData] = await Promise.all([
        obtenerDashboardKPI(tiendaFiltro),
        obtenerTiendas(),
        obtenerKardex(tiendaFiltro, 10),
        obtenerStock(tiendaFiltro),
        obtenerIndicadoresFinancieros(tiendaFiltro),
      ]);
      setKpi(kpiData);
      setTiendas(tiendasData);
      setMovimientos(kardexData);
      setStockAlertas(stockData.filter((s) => s.cantidad <= (s.productos?.stock_minimo ?? 0) && (s.productos?.stock_minimo ?? 0) > 0));
      setFinancieros(finData);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      label: "Ventas del día",
      valor: kpi.total_ventas,
      cantidad: kpi.cantidad_ventas,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Entradas del día",
      valor: kpi.total_entradas,
      cantidad: kpi.cantidad_entradas,
      icon: PackagePlus,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Transferencias del día",
      valor: kpi.total_transferencias,
      cantidad: kpi.cantidad_transferencias,
      icon: ArrowLeftRight,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total movimientos",
      valor: kpi.cantidad_ventas + kpi.cantidad_entradas + kpi.cantidad_transferencias,
      cantidad: 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const datosGrafico = [
    { name: "Ventas", cantidad: kpi.total_ventas },
    { name: "Entradas", cantidad: kpi.total_entradas },
    { name: "Transferencias", cantidad: kpi.total_transferencias },
  ];

  const datosPie = [
    { name: "Ventas", value: kpi.cantidad_ventas },
    { name: "Entradas", value: kpi.cantidad_entradas },
    { name: "Transferencias", value: kpi.cantidad_transferencias },
  ].filter((d) => d.value > 0);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Dashboard Diario
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <CalendarClock className="h-4 w-4" />
              {new Date().toLocaleDateString("es-PE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {esAdmin && (
              <select
                value={tiendaFiltro ?? ""}
                onChange={(e) =>
                  setTiendaFiltro(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white"
              >
                <option value="">Todas las tiendas</option>
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                const tiendaNombre = tiendaFiltro ? tiendas.find(t => t.id === tiendaFiltro)?.nombre : undefined;
                exportarReporteDashboard(kpi, tiendaNombre);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {card.valor}
                    </p>
                    {card.cantidad > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {card.cantidad} operaciones
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {stockAlertas.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
                    Alertas de Stock Bajo ({stockAlertas.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {stockAlertas.slice(0, 8).map((s) => (
                    <div key={s.id} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-red-100 dark:border-red-900">
                      <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                        {s.productos?.nombre ?? "—"}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Stock: {s.cantidad} / Mín: {s.productos?.stock_minimo ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {financieros && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valor Inventario (Costo)</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">S/ {financieros.valor_inventario_costo.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valor Inventario (Venta)</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">S/ {financieros.valor_inventario_venta.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                      <DollarSign className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Margen Potencial</p>
                  <p className={`text-xl font-bold ${financieros.margen_potencial >= 0 ? "text-gray-900 dark:text-white" : "text-red-600"}`}>
                    S/ {financieros.margen_potencial.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Utilidad del Mes</p>
                  <p className={`text-xl font-bold ${financieros.utilidad_mes >= 0 ? "text-gray-900 dark:text-white" : "text-red-600"}`}>
                    S/ {financieros.utilidad_mes.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                  Cantidades por tipo de movimiento
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                  Distribución de operaciones
                </h3>
                {datosPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={datosPie}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {datosPie.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">
                    No hay movimientos hoy
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Últimos movimientos
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700">
                      <th className="px-5 py-3 font-medium">Fecha/Hora</th>
                      <th className="px-5 py-3 font-medium">Producto</th>
                      <th className="px-5 py-3 font-medium">Tipo</th>
                      <th className="px-5 py-3 font-medium">Cantidad</th>
                      <th className="px-5 py-3 font-medium">Origen</th>
                      <th className="px-5 py-3 font-medium">Destino</th>
                      <th className="px-5 py-3 font-medium">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov) => (
                      <tr key={mov.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                          {new Date(mov.fecha_hora).toLocaleString("es-PE")}
                        </td>
                        <td className="px-5 py-3 font-medium">
                          {mov.productos?.nombre ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              mov.tipo_movimiento === "ENTRADA"
                                ? "bg-green-100 text-green-700"
                                : mov.tipo_movimiento === "SALIDA"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {mov.tipo_movimiento}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium">{mov.cantidad}</td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                          {mov.tienda_origen?.nombre ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-600 dark:text-gray-300">
                          {mov.tienda_destino?.nombre ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                          {mov.perfiles?.nombre_completo ?? "—"}
                        </td>
                      </tr>
                    ))}
                    {movimientos.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-8 text-center text-gray-400 dark:text-gray-500"
                        >
                          No hay movimientos registrados hoy
                        </td>
                      </tr>
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

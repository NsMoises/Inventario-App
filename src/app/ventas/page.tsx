"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { registrarVenta, obtenerStock } from "@/lib/api";
import { Stock } from "@/lib/types";
import { ShoppingCart, AlertCircle, Search, ScanLine } from "lucide-react";
import Toast from "@/components/Toast";
import BarcodeScanner from "@/components/BarcodeScanner";

type ToastType = {
  message: string;
  type: "success" | "error";
};

export default function VentasPage() {
  const { user, perfil } = useAuth();
  const [stock, setStock] = useState<Stock[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const tiendaId = perfil?.tienda_id;

  useEffect(() => {
    if (tiendaId) {
      cargarStock();
    }
  }, [tiendaId]);

  const cargarStock = async () => {
    if (!tiendaId) return;
    const data = await obtenerStock(tiendaId);
    setStock(data);
  };

  const stockFiltrado = stock.filter((s) => {
    if (!busqueda) return true;
    const nombre = s.productos?.nombre?.toLowerCase() ?? "";
    const sku = s.productos?.sku?.toLowerCase() ?? "";
    const codigo = s.productos?.codigo_barras?.toLowerCase() ?? "";
    const q = busqueda.toLowerCase();
    return nombre.includes(q) || sku.includes(q) || codigo.includes(q);
  });

  const handleVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !tiendaId) return;

    setLoading(true);
    try {
      const result = await registrarVenta(
        Number(productoId),
        tiendaId,
        Number(cantidad),
        user.id
      );

      if (result.exito) {
        setToast({
          message: "Venta registrada exitosamente",
          type: "success",
        });
        setProductoId("");
        setCantidad("");
        cargarStock();
      } else {
        setToast({
          message: result.error ?? "Error al registrar venta",
          type: "error",
        });
      }
    } catch (error: any) {
      setToast({
        message: error.message ?? "Error inesperado",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const productoSeleccionado = stock.find(
    (s) => s.producto_id === Number(productoId)
  );

  return (
    <ProtectedRoute>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Registrar Venta</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <form onSubmit={handleVenta} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Buscar Producto
                </label>
                <div className="relative mb-2 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Nombre, SKU o código..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <button type="button" onClick={() => setShowScanner(true)}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
                    <ScanLine className="h-4 w-4" />
                  </button>
                </div>
                <select
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  size={5}
                >
                  <option value="">Seleccionar producto</option>
                  {stockFiltrado.map((s) => (
                    <option
                      key={s.id}
                      value={s.producto_id}
                      disabled={s.cantidad === 0}
                    >
                      {s.productos?.nombre ?? `Producto #${s.producto_id}`} — Stock: {s.cantidad}
                    </option>
                  ))}
                </select>
                {stockFiltrado.length === 0 && busqueda && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    No se encontraron productos
                  </p>
                )}
              </div>

              {productoSeleccionado && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {productoSeleccionado.productos?.nombre}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SKU: {productoSeleccionado.productos?.sku}
                  </p>
                  {productoSeleccionado.productos?.codigo_barras && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Cód. Barras: {productoSeleccionado.productos.codigo_barras}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Stock disponible:{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {productoSeleccionado.cantidad}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  max={productoSeleccionado?.cantidad ?? 1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>

              {productoSeleccionado &&
                Number(cantidad) > productoSeleccionado.cantidad && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Stock insuficiente. Disponible:{" "}
                    {productoSeleccionado.cantidad}
                  </div>
                )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !productoId ||
                  !cantidad ||
                  Number(cantidad) <= 0 ||
                  (productoSeleccionado &&
                    Number(cantidad) > productoSeleccionado.cantidad)
                }
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Registrar Venta
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
              Stock Disponible
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stock.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {s.productos?.nombre ?? `Producto #${s.producto_id}`}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      SKU: {s.productos?.sku}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      s.cantidad > 10
                        ? "text-green-600"
                        : s.cantidad > 0
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {s.cantidad}
                  </span>
                </div>
              ))}
              {stock.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                  No hay productos en stock
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={(codigo) => {
            setBusqueda(codigo);
            const encontrado = stock.find(
              (s) => s.productos?.codigo_barras === codigo
            );
            if (encontrado) {
              setProductoId(String(encontrado.producto_id));
            }
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </ProtectedRoute>
  );
}

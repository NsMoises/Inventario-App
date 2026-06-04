"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { transferirStock, obtenerTiendas, obtenerStock } from "@/lib/api";
import { Tienda, Stock } from "@/lib/types";
import { ArrowLeftRight, AlertCircle } from "lucide-react";
import Toast from "@/components/Toast";

type ToastType = {
  message: string;
  type: "success" | "error";
};

export default function TransferenciasPage() {
  const { user } = useAuth();
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [stockOrigen, setStockOrigen] = useState<Stock[]>([]);
  const [productoId, setProductoId] = useState("");
  const [tiendaOrigen, setTiendaOrigen] = useState("");
  const [tiendaDestino, setTiendaDestino] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);

  useEffect(() => {
    cargarTiendas();
  }, []);

  useEffect(() => {
    if (tiendaOrigen) {
      cargarStockOrigen(Number(tiendaOrigen));
    } else {
      setStockOrigen([]);
    }
  }, [tiendaOrigen]);

  const cargarTiendas = async () => {
    const data = await obtenerTiendas();
    setTiendas(data);
  };

  const cargarStockOrigen = async (tiendaId: number) => {
    const data = await obtenerStock(tiendaId);
    setStockOrigen(data);
  };

  const handleTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (tiendaOrigen === tiendaDestino) {
      setToast({
        message: "Las tiendas deben ser diferentes",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await transferirStock(
        Number(productoId),
        Number(tiendaOrigen),
        Number(tiendaDestino),
        Number(cantidad),
        user.id
      );

      if (result.exito) {
        setToast({
          message: "Transferencia realizada exitosamente",
          type: "success",
        });
        setProductoId("");
        setCantidad("");
        cargarStockOrigen(Number(tiendaOrigen));
      } else {
        setToast({
          message: result.error ?? "Error al realizar transferencia",
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

  const tiendasDestino = tiendas.filter((t) => t.id !== Number(tiendaOrigen));
  const productoSeleccionado = stockOrigen.find(
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
          <ArrowLeftRight className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Transferencias entre Tiendas
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <form onSubmit={handleTransferencia} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Tienda Origen
                </label>
                <select
                  value={tiendaOrigen}
                  onChange={(e) => {
                    setTiendaOrigen(e.target.value);
                    setTiendaDestino("");
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                >
                  <option value="">Seleccionar origen</option>
                  {tiendas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Tienda Destino
                </label>
                <select
                  value={tiendaDestino}
                  onChange={(e) => setTiendaDestino(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  disabled={!tiendaOrigen}
                >
                  <option value="">Seleccionar destino</option>
                  {tiendasDestino.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Producto
              </label>
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                required
                disabled={!tiendaOrigen}
              >
                <option value="">Seleccionar producto</option>
                {stockOrigen.map((s) => (
                  <option key={s.id} value={s.producto_id}>
                    {s.productos?.nombre ?? `Producto #${s.producto_id}`} — Stock: {s.cantidad}
                  </option>
                ))}
              </select>
              {productoSeleccionado && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Stock disponible:{" "}
                  <span className="font-semibold">
                    {productoSeleccionado.cantidad}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Cantidad a transferir
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
                  Stock insuficiente. Disponible: {productoSeleccionado.cantidad}
                </div>
              )}

            <button
              type="submit"
              disabled={
                loading ||
                !tiendaOrigen ||
                !tiendaDestino ||
                !productoId ||
                !cantidad ||
                Number(cantidad) <= 0 ||
                (productoSeleccionado &&
                  Number(cantidad) > productoSeleccionado.cantidad)
              }
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <ArrowLeftRight className="h-5 w-5" />
                  Realizar Transferencia
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Transferencia Atómica
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                El sistema resta el stock de la tienda origen y lo suma a la
                tienda destino en una sola operación de base de datos. Si ocurre
                un error, ninguna de las dos operaciones se aplica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

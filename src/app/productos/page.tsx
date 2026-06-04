"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto, obtenerStock, obtenerTiendas, registrarEntrada, actualizarStockDirecto } from "@/lib/api";
import { Producto, Stock, Tienda } from "@/lib/types";
import {
  Package, Plus, Pencil, Trash2, Search, Tag, DollarSign,
  Building2, Box, Warehouse, Hash, FileText, Store
} from "lucide-react";
import Toast from "@/components/Toast";

type ToastType = { message: string; type: "success" | "error" };
type ModalMode = "crear" | "editar" | null;

const emptyForm = {
  nombre: "", descripcion: "", sku: "", categoria: "",
  marca: "", proveedor: "", unidad_medida: "unidad",
  precio_compra: 0, precio_venta: 0, stock_minimo: 0,
  tienda_id: 0, cantidad_inicial: 0,
};

export default function ProductosPage() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [tiendaFiltro, setTiendaFiltro] = useState<number | "">("");
  const [toast, setToast] = useState<ToastType | null>(null);

  const [modal, setModal] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [stockEdit, setStockEdit] = useState<Record<number, number>>({});

  useEffect(() => { cargarProductos(); }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const [prodData, stockData, tiendasData] = await Promise.all([
        obtenerProductos(),
        obtenerStock(),
        obtenerTiendas(),
      ]);
      setProductos(prodData);
      setStock(stockData);
      setTiendas(tiendasData);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  const abrirCrear = () => { setEditId(null); setForm(emptyForm); setModal("crear"); };

  const abrirEditar = (p: Producto) => {
    setEditId(p.id);
    setForm({
      nombre: p.nombre, descripcion: p.descripcion, sku: p.sku,
      categoria: p.categoria, marca: p.marca, proveedor: p.proveedor,
      unidad_medida: p.unidad_medida, precio_compra: p.precio_compra,
      precio_venta: p.precio_venta, stock_minimo: p.stock_minimo,
      tienda_id: 0, cantidad_inicial: 0,
    });
    const stockMap: Record<number, number> = {};
    tiendas.forEach((t) => {
      stockMap[t.id] = getStockPorProducto(p.id, t.id);
    });
    setStockEdit(stockMap);
    setModal("editar");
  };

  const set = (field: string, value: any) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "crear") {
        const { tienda_id, cantidad_inicial, ...productoData } = form;
        const prod = await crearProducto(productoData);
        if (tienda_id && cantidad_inicial > 0 && user) {
          await registrarEntrada(prod.id, tienda_id, cantidad_inicial, user.id);
        }
        setToast({ message: "Producto creado con stock inicial", type: "success" });
      } else if (editId && user) {
        await actualizarProducto(editId, form);
        for (const tiendaId of Object.keys(stockEdit)) {
          const tid = Number(tiendaId);
          const nuevaCant = stockEdit[tid];
          const actual = getStockPorProducto(editId, tid);
          if (nuevaCant !== actual) {
            await actualizarStockDirecto(editId, tid, nuevaCant);
          }
        }
        setToast({ message: "Producto y stock actualizados exitosamente", type: "success" });
      }
      setModal(null);
      cargarProductos();
    } catch (error: any) {
      setToast({ message: error.message ?? "Error", type: "error" });
    } finally { setSaving(false); }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      setToast({ message: "Producto eliminado", type: "success" });
      cargarProductos();
    } catch (error: any) {
      setToast({ message: error.message ?? "Error", type: "error" });
    }
  };

  const getStockPorProducto = (productoId: number, tiendaId: number) =>
    stock.find((s) => s.producto_id === productoId && s.tienda_id === tiendaId)?.cantidad ?? 0;

  const filtrados = productos.filter((p) => {
    const coincideBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.sku.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.marca.toLowerCase().includes(busqueda.toLowerCase());
    if (!tiendaFiltro) return coincideBusqueda;
    const stockEnTienda = getStockPorProducto(p.id, Number(tiendaFiltro));
    return coincideBusqueda && stockEnTienda > 0;
  });

  return (
    <ProtectedRoute adminOnly>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
          </div>
          <button onClick={abrirCrear}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Nuevo Producto
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, SKU, categoría o marca..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-gray-400" />
            <select value={tiendaFiltro} onChange={(e) => setTiendaFiltro(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-800 dark:text-white">
              <option value="">Todas las tiendas</option>
              {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
            </select>
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
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Marca</th>
                    <th className="px-4 py-3 font-medium">P. Venta</th>
                    <th className="px-4 py-3 font-medium">Stock Mín</th>
                    {!tiendaFiltro && tiendas.map((t) => (
                      <th key={t.id} className="px-3 py-3 font-medium text-primary-600 dark:text-primary-400 text-center text-[10px]">{t.nombre}</th>
                    ))}
                    <th className="px-4 py-3 font-medium">Proveedor</th>
                    <th className="px-4 py-3 font-medium w-20">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{p.nombre}</p>
                        {p.descripcion && <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.descripcion}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.sku}</td>
                      <td className="px-4 py-3">
                        {p.categoria && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{p.categoria}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.marca || "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {p.precio_venta > 0 ? `S/ ${p.precio_venta.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3">{p.stock_minimo}</td>
                      {!tiendaFiltro && tiendas.map((t) => {
                        const cant = getStockPorProducto(p.id, t.id);
                        const bajo = cant <= p.stock_minimo && p.stock_minimo > 0;
                        return (
                          <td key={t.id} className={`px-3 py-3 text-center text-sm font-semibold ${bajo ? "text-red-600 dark:text-red-400" : cant > 0 ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                            {cant}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.proveedor || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => abrirEditar(p)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEliminar(p.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr><td colSpan={7 + tiendas.length} className="px-4 py-12 text-center text-gray-400">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No hay productos registrados
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {modal === "crear" ? "Nuevo Producto" : "Editar Producto"}
            </h2>
            <form onSubmit={handleGuardar} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Tag className="h-3.5 w-3.5" /> Nombre *
                  </label>
                  <input type="text" value={form.nombre} onChange={(e) => set("nombre", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Hash className="h-3.5 w-3.5" /> SKU *
                  </label>
                  <input type="text" value={form.sku} onChange={(e) => set("sku", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" required />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FileText className="h-3.5 w-3.5" /> Categoría
                  </label>
                  <input type="text" value={form.categoria} onChange={(e) => set("categoria", e.target.value)}
                    placeholder="Ej: Electrónicos, Ropa, etc."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Building2 className="h-3.5 w-3.5" /> Marca
                  </label>
                  <input type="text" value={form.marca} onChange={(e) => set("marca", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <DollarSign className="h-3.5 w-3.5" /> Precio Compra
                  </label>
                  <input type="number" step="0.01" min="0" value={form.precio_compra} onChange={(e) => set("precio_compra", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <DollarSign className="h-3.5 w-3.5" /> Precio Venta
                  </label>
                  <input type="number" step="0.01" min="0" value={form.precio_venta} onChange={(e) => set("precio_venta", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Box className="h-3.5 w-3.5" /> Unidad de Medida
                  </label>
                  <select value={form.unidad_medida} onChange={(e) => set("unidad_medida", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white">
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="l">Litro (L)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="m">Metro (m)</option>
                    <option value="caja">Caja</option>
                    <option value="pack">Pack</option>
                    <option value="par">Par</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Warehouse className="h-3.5 w-3.5" /> Stock Mínimo
                  </label>
                  <input type="number" min="0" value={form.stock_minimo} onChange={(e) => set("stock_minimo", Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                </div>

                {modal === "crear" && (
                  <>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Store className="h-3.5 w-3.5" /> Tienda destino *
                      </label>
                      <select value={form.tienda_id} onChange={(e) => set("tienda_id", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white">
                        <option value={0}>Seleccionar tienda</option>
                        {tiendas.map((t) => (<option key={t.id} value={t.id}>{t.nombre}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Box className="h-3.5 w-3.5" /> Cantidad inicial *
                      </label>
                      <input type="number" min="0" value={form.cantidad_inicial} onChange={(e) => set("cantidad_inicial", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                    </div>
                  </>
                )}

                {modal === "editar" && (
                  <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                      <Warehouse className="h-4 w-4" /> Stock por tienda
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {tiendas.map((t) => (
                        <div key={t.id}>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.nombre}</label>
                          <input type="number" min="0" value={stockEdit[t.id] ?? 0}
                            onChange={(e) => setStockEdit((prev) => ({ ...prev, [t.id]: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Building2 className="h-3.5 w-3.5" /> Proveedor
                  </label>
                  <input type="text" value={form.proveedor} onChange={(e) => set("proveedor", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FileText className="h-3.5 w-3.5" /> Descripción
                  </label>
                  <textarea value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { obtenerUsuarios, actualizarUsuario, eliminarUsuario, obtenerTiendas } from "@/lib/api";
import { Perfil, Tienda } from "@/lib/types";
import { Users, Pencil, Trash2, Shield, Store, UserCircle, Plus } from "lucide-react";
import Toast from "@/components/Toast";

type ToastType = { message: string; type: "success" | "error" };
type ModalMode = "crear" | "editar" | null;

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [tiendas, setTiendas] = useState<Tienda[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [saving, setSaving] = useState(false);

  // Modal
  const [modal, setModal] = useState<ModalMode>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editNombre, setEditNombre] = useState("");
  const [editRol, setEditRol] = useState<"admin" | "usuario_tienda">("usuario_tienda");
  const [editTienda, setEditTienda] = useState<number | null>(null);
  const [editActivo, setEditActivo] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([obtenerUsuarios(), obtenerTiendas()]);
      setUsuarios(u);
      setTiendas(t);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const abrirCrear = () => {
    setEditId(null);
    setEditEmail("");
    setEditPassword("");
    setEditNombre("");
    setEditRol("usuario_tienda");
    setEditTienda(null);
    setEditActivo(true);
    setModal("crear");
  };

  const abrirEditar = (u: Perfil) => {
    setEditId(u.id);
    setEditEmail(u.email);
    setEditPassword("");
    setEditNombre(u.nombre_completo);
    setEditRol(u.rol);
    setEditTienda(u.tienda_id);
    setEditActivo(u.activo);
    setModal("editar");
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "crear") {
        const res = await fetch("/api/usuarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: editEmail,
            password: editPassword,
            nombre_completo: editNombre,
            rol: editRol,
            tienda_id: editRol === "usuario_tienda" ? editTienda : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setToast({ message: "Usuario creado exitosamente", type: "success" });
      } else if (editId) {
        await actualizarUsuario(editId, {
          nombre_completo: editNombre,
          rol: editRol,
          tienda_id: editRol === "admin" ? null : editTienda,
          activo: editActivo,
        });
        setToast({ message: "Usuario actualizado exitosamente", type: "success" });
      }
      setModal(null);
      cargarDatos();
    } catch (error: any) {
      setToast({ message: error.message ?? "Error", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await eliminarUsuario(id);
      setToast({ message: "Usuario eliminado", type: "success" });
      cargarDatos();
    } catch (error: any) {
      setToast({ message: error.message ?? "Error", type: "error" });
    }
  };

  return (
    <ProtectedRoute adminOnly>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestión de Usuarios</h1>
          </div>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuarios.map((u) => (
              <div
                key={u.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border p-5 shadow-sm ${
                  u.activo ? "border-gray-200 dark:border-gray-700" : "border-gray-200 dark:border-gray-700 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <UserCircle className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{u.nombre_completo}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(u)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(u.id)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {u.rol === "admin" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      <Store className="h-3 w-3" />
                      {tiendas.find((t) => t.id === u.tienda_id)?.nombre ?? "Usuario"}
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <span className={`text-xs ${u.activo ? "text-green-600" : "text-red-500"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {modal === "crear" ? "Crear Usuario" : "Editar Usuario"}
            </h2>
            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  readOnly={modal === "editar"}
                />
              </div>
              {modal === "crear" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                    minLength={4}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Rol</label>
                <select
                  value={editRol}
                  onChange={(e) => {
                    setEditRol(e.target.value as "admin" | "usuario_tienda");
                    if (e.target.value === "admin") setEditTienda(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="usuario_tienda">Usuario de Tienda</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {editRol === "usuario_tienda" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tienda asignada</label>
                  <select
                    value={editTienda ?? ""}
                    onChange={(e) => setEditTienda(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                  >
                    <option value="">Seleccionar tienda</option>
                    {tiendas.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              )}
              {modal === "editar" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={editActivo}
                    onChange={(e) => setEditActivo(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="activo" className="text-sm text-gray-700 dark:text-gray-200">Usuario activo</label>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
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

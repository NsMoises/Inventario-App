import { supabase } from "./supabase";
import { Kardex, Producto, Stock, Tienda, Perfil, DashboardKPI } from "./types";

// ========================
// TIENDAS
// ========================
export async function obtenerTiendas(): Promise<Tienda[]> {
  const { data, error } = await supabase
    .from("tiendas")
    .select("*")
    .order("id");
  if (error) throw error;
  return data ?? [];
}

// ========================
// PRODUCTOS
// ========================
export async function obtenerProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function crearProducto(producto: {
  nombre: string;
  descripcion: string;
  sku: string;
  categoria?: string;
  marca?: string;
  proveedor?: string;
  unidad_medida?: string;
  precio_compra?: number;
  precio_venta?: number;
  stock_minimo?: number;
}): Promise<Producto> {
  const { data, error } = await supabase
    .from("productos")
    .insert(producto)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function actualizarProducto(
  id: number,
  producto: Partial<Pick<Producto, "nombre" | "descripcion" | "sku" | "categoria" | "marca" | "proveedor" | "unidad_medida" | "precio_compra" | "precio_venta" | "stock_minimo">>
): Promise<void> {
  const { error } = await supabase
    .from("productos")
    .update(producto)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarProducto(id: number): Promise<void> {
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) throw error;
}

// ========================
// STOCK
// ========================
export async function obtenerStock(
  tiendaId?: number
): Promise<Stock[]> {
  let query = supabase
    .from("stock")
    .select("*, productos(*), tiendas(*)");

  if (tiendaId) {
    query = query.eq("tienda_id", tiendaId);
  }

  const { data, error } = await query.order("producto_id");
  if (error) throw error;
  return data ?? [];
}

// ========================
// KARDEX / MOVIMIENTOS
// ========================
export async function obtenerKardex(
  tiendaId?: number,
  limite: number = 100,
  fechaDesde?: string,
  fechaHasta?: string
): Promise<Kardex[]> {
  let query = supabase
    .from("kardex")
    .select("*, productos(*), tienda_origen:tienda_origen_id(*), tienda_destino:tienda_destino_id(*), perfiles(*)")
    .order("fecha_hora", { ascending: false })
    .limit(limite);

  if (tiendaId) {
    query = query.or(
      `tienda_origen_id.eq.${tiendaId},tienda_destino_id.eq.${tiendaId}`
    );
  }

  if (fechaDesde) {
    query = query.gte("fecha_hora", fechaDesde);
  }

  if (fechaHasta) {
    query = query.lte("fecha_hora", fechaHasta + "T23:59:59.999Z");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// ========================
// ENTRADAS (RPC)
// ========================
export async function registrarEntrada(
  productoId: number,
  tiendaId: number,
  cantidad: number,
  usuarioId: string
): Promise<{ exito: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("registrar_entrada", {
    p_producto_id: productoId,
    p_tienda_id: tiendaId,
    p_cantidad: cantidad,
    p_usuario_id: usuarioId,
  });
  if (error) return { exito: false, error: error.message };
  return data as { exito: boolean; error?: string };
}

// ========================
// VENTAS (RPC)
// ========================
export async function registrarVenta(
  productoId: number,
  tiendaId: number,
  cantidad: number,
  usuarioId: string
): Promise<{ exito: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("registrar_venta", {
    p_producto_id: productoId,
    p_tienda_id: tiendaId,
    p_cantidad: cantidad,
    p_usuario_id: usuarioId,
  });
  if (error) return { exito: false, error: error.message };
  return data as { exito: boolean; error?: string };
}

// ========================
// TRANSFERENCIAS (RPC)
// ========================
export async function transferirStock(
  productoId: number,
  tiendaOrigenId: number,
  tiendaDestinoId: number,
  cantidad: number,
  usuarioId: string
): Promise<{ exito: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("transferir_stock", {
    p_producto_id: productoId,
    p_tienda_origen_id: tiendaOrigenId,
    p_tienda_destino_id: tiendaDestinoId,
    p_cantidad: cantidad,
    p_usuario_id: usuarioId,
  });
  if (error) return { exito: false, error: error.message };
  return data as { exito: boolean; error?: string };
}

// ========================
// USUARIOS / PERFILES (SOLO ADMIN)
// ========================
export async function obtenerUsuarios(): Promise<Perfil[]> {
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .order("nombre_completo");
  if (error) throw error;
  return data ?? [];
}

export async function actualizarUsuario(
  id: string,
  updates: Partial<Pick<Perfil, "nombre_completo" | "rol" | "tienda_id" | "activo">>
): Promise<void> {
  const { error } = await supabase
    .from("perfiles")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarUsuario(id: string): Promise<void> {
  const { error } = await supabase
    .from("perfiles")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ========================
// DASHBOARD KPIs
// ========================
export async function obtenerDashboardKPI(
  tiendaId?: number
): Promise<DashboardKPI> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let query = supabase
    .from("kardex")
    .select("tipo_movimiento, cantidad")
    .gte("fecha_hora", hoy.toISOString());

  if (tiendaId) {
    query = query.or(
      `tienda_origen_id.eq.${tiendaId},tienda_destino_id.eq.${tiendaId}`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const kpi: DashboardKPI = {
    total_ventas: 0,
    total_entradas: 0,
    total_transferencias: 0,
    cantidad_ventas: 0,
    cantidad_entradas: 0,
    cantidad_transferencias: 0,
  };

  data?.forEach((mov) => {
    if (mov.tipo_movimiento === "SALIDA") {
      kpi.total_ventas += mov.cantidad;
      kpi.cantidad_ventas++;
    } else if (mov.tipo_movimiento === "ENTRADA") {
      kpi.total_entradas += mov.cantidad;
      kpi.cantidad_entradas++;
    } else if (mov.tipo_movimiento === "TRANSFERENCIA") {
      kpi.total_transferencias += mov.cantidad;
      kpi.cantidad_transferencias++;
    }
  });

  return kpi;
}

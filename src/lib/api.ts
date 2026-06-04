import { supabase } from "./supabase";
import { Kardex, Producto, Stock, Tienda, Perfil, DashboardKPI, IndicadoresFinancieros } from "./types";

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

export async function actualizarStockDirecto(
  productoId: number,
  tiendaId: number,
  cantidad: number
): Promise<void> {
  const { error } = await supabase
    .from("stock")
    .upsert(
      { producto_id: productoId, tienda_id: tiendaId, cantidad },
      { onConflict: "producto_id, tienda_id" }
    );
  if (error) throw error;
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

// ========================
// INDICADORES FINANCIEROS
// ========================
export interface RentabilidadProducto {
  producto_id: number;
  nombre: string;
  sku: string;
  cantidad_vendida: number;
  precio_compra: number;
  precio_venta: number;
  margen_unitario: number;
  margen_total: number;
}

export interface MovimientoFinanciero {
  mes: string;
  ingresos: number;
  egresos: number;
}

export async function obtenerIndicadoresFinancieros(
  tiendaId?: number
): Promise<IndicadoresFinancieros> {
  const { data: stockData, error: stockError } = await supabase
    .from("stock")
    .select("cantidad, productos(*)")
    .order("producto_id");

  if (stockError) throw stockError;

  let valorCosto = 0;
  let valorVenta = 0;
  const rentabilidadMap = new Map<number, RentabilidadProducto>();

  stockData?.forEach((s) => {
    const p = s.productos as any;
    if (p) {
      const costo = (p.precio_compra ?? 0) * s.cantidad;
      const venta = (p.precio_venta ?? 0) * s.cantidad;
      valorCosto += costo;
      valorVenta += venta;
    }
  });

  const desde = new Date();
  desde.setDate(1);
  desde.setHours(0, 0, 0, 0);

  let query = supabase
    .from("kardex")
    .select("*, productos(*)")
    .gte("fecha_hora", desde.toISOString())
    .eq("tipo_movimiento", "SALIDA");

  if (tiendaId) {
    query = query.eq("tienda_origen_id", tiendaId);
  }

  const { data: ventasMes } = await query;
  let utilidadMes = 0;

  ventasMes?.forEach((v) => {
    const p = v.productos as any;
    if (p) {
      const margen = (p.precio_venta ?? 0) - (p.precio_compra ?? 0);
      utilidadMes += margen * v.cantidad;
    }
  });

  const { data: todosVendidos } = await supabase
    .from("kardex")
    .select("*, productos(*)")
    .eq("tipo_movimiento", "SALIDA");

  todosVendidos?.forEach((v) => {
    const p = v.productos as any;
    if (!p) return;
    const id = p.id;
    if (!rentabilidadMap.has(id)) {
      rentabilidadMap.set(id, {
        producto_id: id,
        nombre: p.nombre,
        sku: p.sku,
        cantidad_vendida: 0,
        precio_compra: p.precio_compra ?? 0,
        precio_venta: p.precio_venta ?? 0,
        margen_unitario: (p.precio_venta ?? 0) - (p.precio_compra ?? 0),
        margen_total: 0,
      });
    }
    const r = rentabilidadMap.get(id)!;
    r.cantidad_vendida += v.cantidad;
    r.margen_total = r.margen_unitario * r.cantidad_vendida;
  });

  const rentabilidad = Array.from(rentabilidadMap.values())
    .sort((a, b) => b.margen_total - a.margen_total)
    .slice(0, 20);

  return {
    valor_inventario_costo: valorCosto,
    valor_inventario_venta: valorVenta,
    margen_potencial: valorVenta - valorCosto,
    utilidad_mes: utilidadMes,
    rentabilidad_productos: rentabilidad,
  };
}

export async function obtenerMovimientosFinancieros(
  tiendaId?: number
): Promise<MovimientoFinanciero[]> {
  const { data, error } = await supabase
    .from("kardex")
    .select("fecha_hora, tipo_movimiento, cantidad, productos(*)")
    .in("tipo_movimiento", ["ENTRADA", "SALIDA"])
    .order("fecha_hora", { ascending: true })
    .limit(2000);

  if (error) throw error;

  const meses = new Map<string, { ingresos: number; egresos: number }>();

  data?.forEach((mov) => {
    const p = mov.productos as any;
    if (!p) return;
    const mes = new Date(mov.fecha_hora).toISOString().slice(0, 7);
    if (!meses.has(mes)) meses.set(mes, { ingresos: 0, egresos: 0 });
    const m = meses.get(mes)!;
    if (mov.tipo_movimiento === "SALIDA") {
      m.ingresos += (p.precio_venta ?? 0) * mov.cantidad;
    } else {
      m.egresos += (p.precio_compra ?? 0) * mov.cantidad;
    }
  });

  return Array.from(meses.entries())
    .map(([mes, vals]) => ({ mes, ...vals }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

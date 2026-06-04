export interface Tienda {
  id: number;
  nombre: string;
  created_at: string;
}

export interface Perfil {
  id: string;
  email: string;
  nombre_completo: string;
  rol: "admin" | "usuario_tienda";
  tienda_id: number | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  sku: string;
  categoria: string;
  marca: string;
  proveedor: string;
  unidad_medida: string;
  precio_compra: number;
  precio_venta: number;
  stock_minimo: number;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  producto_id: number;
  tienda_id: number;
  cantidad: number;
  created_at: string;
  updated_at: string;
  productos?: Producto;
  tiendas?: Tienda;
}

export interface Kardex {
  id: number;
  producto_id: number;
  tienda_origen_id: number | null;
  tienda_destino_id: number | null;
  tipo_movimiento: "ENTRADA" | "SALIDA" | "TRANSFERENCIA";
  cantidad: number;
  fecha_hora: string;
  usuario_id: string;
  created_at: string;
  productos?: Producto;
  tienda_origen?: Tienda;
  tienda_destino?: Tienda;
  perfiles?: Perfil;
}

export interface DashboardKPI {
  total_ventas: number;
  total_entradas: number;
  total_transferencias: number;
  cantidad_ventas: number;
  cantidad_entradas: number;
  cantidad_transferencias: number;
}

export interface IndicadoresFinancieros {
  valor_inventario_costo: number;
  valor_inventario_venta: number;
  margen_potencial: number;
  utilidad_mes: number;
  rentabilidad_productos: {
    producto_id: number;
    nombre: string;
    sku: string;
    cantidad_vendida: number;
    precio_compra: number;
    precio_venta: number;
    margen_unitario: number;
    margen_total: number;
  }[];
}

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@inventario.com";
const DEMO_PASSWORD = "Demo2024!";
const DEMO_NAME = "Usuario Demo";
const DEMO_ROLE = "admin";

async function seedDemoData(supabaseAdmin: any, userId: string) {
  const { data: tiendas } = await supabaseAdmin.from("tiendas").select("id, nombre");
  if (!tiendas || tiendas.length === 0) return;

  // Check if demo products already exist
  const { count } = await supabaseAdmin
    .from("productos")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) return; // Already seeded

  const productos = [
    { nombre: "Laptop HP Pavilion", descripcion: "Laptop 15.6\" i5 12va", sku: "LAP-HP-001", categoria: "Electrónicos", marca: "HP", proveedor: "Distribuidora HP", unidad_medida: "unidad", precio_compra: 2500, precio_venta: 3299, stock_minimo: 3 },
    { nombre: "Teclado Mecánico Logitech", descripcion: "Teclado mecánico RGB", sku: "TEC-LOG-001", categoria: "Periféricos", marca: "Logitech", proveedor: "Logitech Perú", unidad_medida: "unidad", precio_compra: 180, precio_venta: 299, stock_minimo: 5 },
    { nombre: "Mouse Inalámbrico", descripcion: "Mouse ergonómico 2.4GHz", sku: "MOU-GEN-001", categoria: "Periféricos", marca: "Genérico", proveedor: "Importadora ABC", unidad_medida: "unidad", precio_compra: 35, precio_venta: 69, stock_minimo: 10 },
    { nombre: "Monitor Samsung 24\"", descripcion: "Monitor IPS Full HD", sku: "MON-SAM-001", categoria: "Electrónicos", marca: "Samsung", proveedor: "Samsung Perú", unidad_medida: "unidad", precio_compra: 600, precio_venta: 899, stock_minimo: 2 },
    { nombre: "Cable USB-C 2m", descripcion: "Cable de carga rápida", sku: "CAB-USBC-001", categoria: "Accesorios", marca: "Genérico", proveedor: "Importadora ABC", unidad_medida: "unidad", precio_compra: 8, precio_venta: 19, stock_minimo: 20 },
    { nombre: "Audífonos Bluetooth Sony", descripcion: "Audífonos over-ear con cancelación", sku: "AUD-SON-001", categoria: "Audio", marca: "Sony", proveedor: "Sony Perú", unidad_medida: "unidad", precio_compra: 350, precio_venta: 549, stock_minimo: 3 },
    { nombre: "Webcam HD 1080p", descripcion: "Cámara web con micrófono", sku: "WEB-GEN-001", categoria: "Periféricos", marca: "Genérico", proveedor: "Importadora ABC", unidad_medida: "unidad", precio_compra: 60, precio_venta: 129, stock_minimo: 5 },
    { nombre: "Hub USB 4 puertos", descripcion: "Hub USB 3.0", sku: "HUB-GEN-001", categoria: "Accesorios", marca: "Genérico", proveedor: "Importadora ABC", unidad_medida: "unidad", precio_compra: 25, precio_venta: 49, stock_minimo: 10 },
    { nombre: "Disco Duro Externo 1TB", descripcion: "Disco portátil USB 3.0", sku: "HDD-GEN-001", categoria: "Almacenamiento", marca: "Seagate", proveedor: "Seagate Perú", unidad_medida: "unidad", precio_compra: 200, precio_venta: 329, stock_minimo: 3 },
    { nombre: "Cargador Laptop Universal", descripcion: "Cargador 65W con puntas intercambiables", sku: "CAR-GEN-001", categoria: "Accesorios", marca: "Genérico", proveedor: "Importadora ABC", unidad_medida: "unidad", precio_compra: 45, precio_venta: 89, stock_minimo: 5 },
  ];

  for (const p of productos) {
    const { data: prod } = await (supabaseAdmin
      .from("productos")
      .insert(p as any)
      .select("id")
      .single() as any);

    if (!prod) continue;

    // Add stock in random stores
    for (const tienda of (tiendas as any[])) {
      const cantidad = Math.floor(Math.random() * 15) + 5;
      await supabaseAdmin.rpc("registrar_entrada" as any, {
        p_producto_id: prod.id,
        p_tienda_id: tienda.id,
        p_cantidad: cantidad,
        p_usuario_id: userId,
      } as any);
    }

    // Simulate some random sales
    for (const tienda of (tiendas as any[])) {
      const ventas = Math.floor(Math.random() * 3);
      for (let i = 0; i < ventas; i++) {
        const cant = Math.floor(Math.random() * 3) + 1;
        await supabaseAdmin.rpc("registrar_venta" as any, {
          p_producto_id: prod.id,
          p_tienda_id: tienda.id,
          p_cantidad: cant,
          p_usuario_id: userId,
        } as any);
      }
    }
  }

  // Simulate transfers between stores
  if ((tiendas as any[]).length >= 2) {
    const { data: stocks } = await supabaseAdmin
      .from("stock" as any)
      .select("producto_id, tienda_id, cantidad")
      .gte("cantidad" as any, 3) as any;

    if (stocks) {
      for (const s of stocks.slice(0, 5)) {
        const destino = (tiendas as any[]).find((t: any) => t.id !== (s as any).tienda_id);
        if (destino) {
          await supabaseAdmin.rpc("transferir_stock" as any, {
            p_producto_id: (s as any).producto_id,
            p_tienda_origen_id: (s as any).tienda_id,
            p_tienda_destino_id: (destino as any).id,
            p_cantidad: 2,
            p_usuario_id: userId,
          } as any);
        }
      }
    }
  }
}

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find or create demo user
    let userId: string;

    const { data: existingUsers } = await supabaseAdmin
      .auth.admin.listUsers();

    const demoUser = existingUsers?.users.find((u) => u.email === DEMO_EMAIL);

    if (demoUser) {
      userId = demoUser.id;
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { nombre_completo: DEMO_NAME, rol: DEMO_ROLE },
      });

      if (createError || !newUser?.user) {
        return NextResponse.json({ error: "Error al crear usuario demo" }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    // Ensure profile exists and has admin role
    const { data: perfil } = await supabaseAdmin
      .from("perfiles")
      .upsert({
        id: userId,
        email: DEMO_EMAIL,
        nombre_completo: DEMO_NAME,
        rol: DEMO_ROLE,
        tienda_id: null,
        activo: true,
      } as any, { onConflict: "id" })
      .select("id")
      .single();

    if (!perfil) {
      return NextResponse.json({ error: "Error al crear perfil" }, { status: 500 });
    }

    // Seed demo data
    await seedDemoData(supabaseAdmin, userId);

    return NextResponse.json({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Error interno" },
      { status: 500 }
    );
  }
}

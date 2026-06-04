import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email, password, nombre_completo, rol, tienda_id } =
      await request.json();

    if (!email || !password || !nombre_completo || !rol) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: userData, error: signUpError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre_completo,
          rol,
        },
      });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    const { error: upsertError } = await supabaseAdmin.from("perfiles").upsert(
      {
        id: userId,
        email,
        nombre_completo,
        rol,
        tienda_id: rol === "usuario_tienda" ? tienda_id : null,
        activo: true,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ exito: true, id: userId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message ?? "Error interno" },
      { status: 500 }
    );
  }
}

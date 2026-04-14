export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    
    // Validar si la base de datos está conectada
    if (!env.DB) {
      return new Response(JSON.stringify({ success: false, message: "Base de datos no configurada." }), { 
        status: 500, headers: { "Content-Type": "application/json" } 
      });
    }

    const { username, password } = await request.json();
    
    // Buscar al usuario en la base de datos
    const stmt = env.DB.prepare("SELECT * FROM users WHERE username = ?");
    const user = await stmt.bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: "Usuario no encontrado." }), { 
        status: 401, headers: { "Content-Type": "application/json" } 
      });
    }

    // Verificar la contraseña (texto plano por ahora)
    if (password !== user.password) {
      return new Response(JSON.stringify({ success: false, message: "Contraseña incorrecta." }), { 
        status: 401, headers: { "Content-Type": "application/json" } 
      });
    }

    // --- NUEVO: SUMAR UNA VISITA AL CONTADOR ---
    // Incrementamos el campo 'visits' en 1 para este usuario
    try {
      await env.DB.prepare("UPDATE users SET visits = COALESCE(visits, 0) + 1 WHERE id = ?").bind(user.id).run();
    } catch (updateError) {
      // Si falla la actualización del contador (ej: porque la columna aún no existe), 
      // no bloqueamos el login, solo lo dejamos pasar silenciosamente.
      console.error("No se pudo actualizar el contador de visitas:", updateError);
    }

    // Si todo está bien, devolver los datos (sin la contraseña)
    const { password: _, ...safeUser } = user;
    
    return new Response(JSON.stringify({ success: true, user: safeUser }), { 
      status: 200, headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: "Error interno del servidor.", error: error.message }), { 
      status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}

export async function onRequestPost(context) {
  try {
    // 1. Extraemos los datos del entorno (DB) y lo que nos mandó el HTML (username, password)
    const { request, env } = context;
    const body = await request.json();
    const { username, password } = body;

    // 2. Validación básica
    if (!username || !password) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Faltan datos de usuario o contraseña" 
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Consultamos la base de datos D1
    // Usamos .toLowerCase() para que no importe si escriben "Ana" o "ana"
    const query = `SELECT username, role, name, first_name FROM users WHERE username = ? AND password = ?`;
    const user = await env.DB.prepare(query).bind(username.toLowerCase(), password).first();

    // 4. Respondemos según el resultado
    if (user) {
      // ÉXITO: Devolvemos los datos del usuario (sin devolver la contraseña)
      return new Response(JSON.stringify({
        success: true,
        user: {
          username: user.username,
          role: user.role,
          name: user.name,
          firstName: user.first_name
        }
      }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } else {
      // ERROR: Credenciales incorrectas
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Usuario o contraseña incorrectos" 
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    // Manejo de errores del servidor
    return new Response(JSON.stringify({ 
      success: false, 
      message: "Error interno del servidor: " + error.message 
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

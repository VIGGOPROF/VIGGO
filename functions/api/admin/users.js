export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. OBTENER LA LISTA DE USUARIOS (GET)
  if (request.method === "GET") {
    try {
      // Ahora también pedimos el campo visits
      const { results } = await env.DB.prepare("SELECT id, username, role, name, first_name, visits FROM users ORDER BY id DESC").all();
      // Envolvemos la respuesta en { success: true, users: [...] } para que el frontend lo lea perfecto
      return new Response(JSON.stringify({ success: true, users: results }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  // 2. CREAR UN NUEVO USUARIO (POST)
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { username, password, role, name } = body;
      
      // Armamos un first_name provisorio usando la primera palabra del nombre
      const first_name = name ? name.split(' ')[0] : '';

      await env.DB.prepare(
        "INSERT INTO users (username, password, role, name, first_name) VALUES (?, ?, ?, ?, ?)"
      ).bind(username.toLowerCase(), password, role, name, first_name).run();

      return new Response(JSON.stringify({ success: true }), { status: 201, headers: { "Content-Type": "application/json" } });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: "El usuario ya existe o hay un error al guardarlo." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  }

  // 3. ACTUALIZAR UN USUARIO (PUT)
  if (request.method === "PUT") {
    try {
      const body = await request.json();
      const { id, username, password, role, name } = body;

      if (!id || !username || !role) {
        return new Response(JSON.stringify({ success: false, message: "Faltan datos requeridos." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      // Si pasaron contraseña, la actualizamos. Si no, actualizamos el resto.
      // También incluimos el 'name' por si se modifica desde el panel
      if (password) {
        await env.DB.prepare(
          "UPDATE users SET username = ?, password = ?, role = ?, name = ? WHERE id = ?"
        ).bind(username.toLowerCase(), password, role, name, id).run();
      } else {
        await env.DB.prepare(
          "UPDATE users SET username = ?, role = ?, name = ? WHERE id = ?"
        ).bind(username.toLowerCase(), role, name, id).run();
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  // 4. BORRAR UN USUARIO (DELETE)
  if (request.method === "DELETE") {
    try {
      const id = url.searchParams.get("id");
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

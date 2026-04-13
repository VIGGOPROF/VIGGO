export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 1. OBTENER LA LISTA DE USUARIOS (GET)
  if (request.method === "GET") {
    try {
      const { results } = await env.DB.prepare("SELECT id, username, role, name, first_name FROM users ORDER BY id DESC").all();
      return new Response(JSON.stringify(results), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  // 2. CREAR UN NUEVO USUARIO (POST)
  if (request.method === "POST") {
    try {
      const body = await request.json();
      const { username, password, role, name, first_name } = body;

      await env.DB.prepare(
        "INSERT INTO users (username, password, role, name, first_name) VALUES (?, ?, ?, ?, ?)"
      ).bind(username.toLowerCase(), password, role, name, first_name).run();

      return new Response(JSON.stringify({ success: true }), { status: 201 });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, message: "El usuario ya existe o hay un error." }), { status: 400 });
    }
  }

  // 3. ACTUALIZAR UN USUARIO (PUT) - AHORA INCLUYE EL ROL
  if (request.method === "PUT") {
    try {
      const body = await request.json();
      const { id, username, password, role } = body;

      if (!id || !username || !role) {
        return new Response(JSON.stringify({ success: false, message: "Faltan datos requeridos." }), { status: 400 });
      }

      // Si pasaron una contraseña nueva, la actualizamos. Si no, actualizamos solo usuario y rol.
      if (password) {
        await env.DB.prepare(
          "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?"
        ).bind(username.toLowerCase(), password, role, id).run();
      } else {
        await env.DB.prepare(
          "UPDATE users SET username = ?, role = ? WHERE id = ?"
        ).bind(username.toLowerCase(), role, id).run();
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
    }
  }

  // 4. BORRAR UN USUARIO (DELETE)
  if (request.method === "DELETE") {
    try {
      const id = url.searchParams.get("id");
      await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

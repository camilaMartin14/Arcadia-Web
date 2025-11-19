const form = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  mensaje.textContent = "";

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!usuario || !password) {
    mensaje.textContent = "⚠️ Completá todos los campos.";
    return;
  }

  try {
    const res = await fetch("http://localhost:5157/api/cliente/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Usuario: usuario, Contraseña: password })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("usuario", JSON.stringify(data));
      window.location.href = "dashboard.html";
    } else {
      mensaje.textContent = "❌ Usuario o contraseña incorrectos.";
    }
  } catch (error) {
    mensaje.textContent = "⚠️ Error de conexión con el servidor.";
  }
});

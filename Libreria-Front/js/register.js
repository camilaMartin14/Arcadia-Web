const form = document.getElementById("registerForm");
const mensaje = document.getElementById("mensaje");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  mensaje.textContent = "";
  mensaje.classList.remove("text-success", "text-danger");

  const usuario = document.getElementById("usuario").value.trim();
  const password = document.getElementById("password").value.trim();
  const confirmar = document.getElementById("confirmar").value.trim();
  const email = document.getElementById("email").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const nroDoc = parseInt(document.getElementById("nroDoc").value);

  if (!usuario || !password || !confirmar || !email || !nombre || !apellido || !nroDoc) {
    mensaje.textContent = "⚠️ Completá todos los campos.";
    mensaje.classList.add("text-danger");
    return;
  }

  if (password !== confirmar) {
    mensaje.textContent = "⚠️ Las contraseñas no coinciden.";
    mensaje.classList.add("text-danger");
    return;
  }

const nuevoCliente = {
  NombreUsuario: document.getElementById("usuario").value,
  Contrasena: document.getElementById("password").value,
  Nombre: document.getElementById("nombre").value,
  Apellido: document.getElementById("apellido").value,
  NroDoc: nroDoc,
  IdTipoDoc: 1,
  IdSexo: 1,
  IdNacionalidad: 1,
  FechaNacimiento: "2000-01-01",
  IdBarrio: 1,
  Calle: "Sin datos",
  Nro: 0,
  Cp: "0000",
  Email: email
};


  try {
    const res = await fetch("http://localhost:5157/api/cliente/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoCliente)
    });

    if (res.ok) {
      mensaje.classList.add("text-success");
      mensaje.textContent = "✅ Registro exitoso. Redirigiendo...";
      setTimeout(() => (window.location.href = "login.html"), 2000);
    } else {
      const errorText = await res.text();
      mensaje.classList.add("text-danger");
      mensaje.textContent = `❌ Error al registrarse: ${errorText}`;
    }
  } catch (error) {
    mensaje.classList.add("text-danger");
    mensaje.textContent = "⚠️ No se pudo conectar con el servidor.";
  }
});

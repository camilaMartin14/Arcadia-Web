# Arcadia — E-commerce de Libros

Arcadia es una aplicación e-commerce desarrollada con **.NET**, **SQL Server**, **HTML**, **CSS** y **JavaScript**. Implementa una arquitectura en capas con Repository, Services, Controllers y DTOs, junto con un esquema de autenticación basado en **JWT**. El sistema permite administrar un catálogo completo de libros y ejecutar operaciones transaccionales como pedidos y sus respectivos detalles.

Este desarrollo surge como **proyecto integrador** de mi primer año en la Tecnicatura Universitaria en Programación, y me permitió consolidar conocimientos de POO, modelado y gestión de bases de datos relacionales, y arquitectura en capas y trabajo en equipo. 

## 📽️ Demostración del Proyecto A IMPLEMENTAR

* ------> Video demostrativo de funcionalidades
* ------>  Diagrama ER y capturas de interfaz

## 🚀 Contenidos principales

* **Catálogo de libros** con filtros, detalles e información extendida.
* **Gestión de pedidos** y cruce completo con tablas de soporte (Libros, Autores, Categorías).
* **Login y registro seguros** con validación server-side (desde el Backend).
* **Autenticación JWT** para proteger endpoints.
* **Dashboard** con datos resumidos de pedidos y ventas.
* **ABMC** para tablas de soporte (libros, autores, editoriales).
* Arquitectura escalable basada en buenas prácticas de diseño.

## 🧱 Arquitectura

* **Backend (.NET Web API)**

  * Controllers REST
  * Services con lógica de negocio
  * Repository Pattern para acceso a datos
  * DTOs para desacoplar modelos
* **Base de datos (SQL Server)**

  * Modelo relacional con claves foráneas, tablas transaccionales y tablas soporte
* **Frontend (HTML/CSS/JS)**

  * Consumo de API mediante `fetch`
  * Diseño responsive y estético

## 🔐 Seguridad

* JWT con expiración
* Hashing de contraseñas
* Validaciones en cliente y servidor

## 📡 Endpoints principales (ejemplos)

* `POST /api/auth/register` — Registro
* `POST /api/auth/login` — Login + JWT
* `GET /api/libros` — Catálogo
* `POST /api/pedidos` — Crear pedido (JWT)
* `GET /api/pedidos/{id}` — Ver detalle

## 🚧🚧🚧**Aún en desarrollo**🚧🚧🚧

### 📌 Mejoras previstas

🛠️ Fase 1: Base de Datos y Estructura
  ✅Agregar campos de activo e inactivo a los libros para la baja lógica.
  ✅Agregar más inserts coherentes de categorías y géneros literarios.
  ✅Unificar estilos en un único archivo CSS.

🗑️ Fase 2: Implementación de la Baja Lógica
  ✅Eliminar completamente el método de delete de Pedidos.
  ✅Implementar la baja lógica de los pedidos (usando un campo como activo o estado).
  ✅Eliminar el método de delete de Libros.
  ✅Implementar la baja lógica de Libros (usando los campos activo/inactivo creados en el punto 2).

🔒 Fase 3: Validación y Corrección de Formularios
  ✅Corregir la validación para que la fecha de entrega no pueda ser anterior a hoy.
  
  ✅Agregar notificación o validación para evitar inserciones si se deja un campo en blanco al agregar un libro.
  
  Agregar notificación de pedidos y libros creados correctamente
  
  Agregar notificacion ¿Esta seguro que desea eliminar esto/modificar esto otro?
  
🔎 Fase 4: Optimización de Vistas y Filtros
  Corregir el comportamiento de los combos de Libros (carga, y asegurar la lógica de negocio para la selección simple o múltiple).
  
  ✅Corregir la funcionalidad de "ver" (el ojito) y "eliminar" (baja lógica) en la vista de Libros.
  
  Agregar paginado a la vista de Pedidos.
  
  Agregar paginado a la vista de Libros.
  
  Implementar mejoras de filtros en Pedidos:
  
       Filtrar por rango de fecha (no solo por día específico).
       Filtrar por forma de envío y/o estado.
       Filtrar por número de pedido.
       
  Mejorar filtro de cliente (usuario, nombre/apellido o DNI).
  
  Agregar filtros por año de publicación y por editorial.
  
  ✅Quitar la columna vacía y sobrante en la vista "Ver Pedidos".
  

✨ Fase 5: Estética y Diseño (UX)
✅ESTETICO (1): Rediseñar la sección "Sobre Nosotros" (cambiar tamaño de tarjetas, imagen de fondo, colores, y unificar tipografía del título con la home).

✅ESTETICO (2): Corregir la sección "Nuestras sucursales" (quitar la animación al cambiar el tema y ampliar el título de la página).

URGENTE: ✅ Solucionar filtro de activos/inactivos de libros

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

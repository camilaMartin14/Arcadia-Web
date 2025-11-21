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

## 📌 Mejoras previstas
🔧 **Validaciones de pedidos**

Impedir el registro de pedidos con fechas anteriores a la fecha actual.
Restringir cambios de estado: No permitir volver a un estado previo si el pedido ya fue marcado como Entregado.

🎯 **Mejora de la experiencia de usuario**

Reemplazar la visualización de IDs por datos relevantes para el usuario (por ejemplo, mostrar ISBN en lugar del ID del libro).
Incorporar un filtro para buscar pedidos entre dos fechas, en lugar de una única fecha fija.

🗂️ **Gestión de bajas**

Implementar bajas lógicas en pedidos.
Implementar bajas lógicas en libros.



Toma de notas de todo lo q tengo que agregar/corregir: 
PEDIDOS:
1. No se pueden eliminar los pedidos!! borrar completamente
2. Implementar baja logica de los pedidos
3. Me deja modificar el pedido y ponerle una fecha de entrega anterior a hoy, eso no deberia pasar
4. No me avisa que si dejo un campo en blanco al agregar un libro no se insertará
5. Estético: en ver pedidos hay una columna de mas que está vacia, quitar
6. Me deja filtrar pedidos por codigo de cliente, seria mejor hacerlo por usuario ya q no se pueden repetir o por nombre y apellido o por dni (o por todas)
7. En buscar pedidos me deberia dejar filtrar por rango de fecha no por un dia en especifico
8. Estaria bueno que deje filtrar por forma de envio o por estado tambien
9. Estaria bueno que me deje filtrar por numero de pedido
10. Agregar paginado

LIBROS:
1. Los combos de los libros no me cargan
2. Tengo tipos distintos de combos en filtros y en cargas, uno me permite uno solo y el otro varios, revisar que cada uno corresponda a la logica de negocio (por ejemplo puedo tener un libro escrito por dos autores pero no en dos idiomas)
3. Agregar paginado
4. No me trae nada cuando toco el ojito y el eliminar
5. Agregar baja logica
6. Eliminar metodo de delete
7. Agregar isbn a campo de libros!! es lo mas importante
8. Agregar filtro x año de publicacion y x editorial

BASE DE DATOS:
1. Agregar mas inserts coherentes con categorias
2. Agregar mas inserts coherentes con generos literarios
3. Agregar a los libros campos de activo e inactivo para permitir baja logica

ESTETICO:
1. Cambiar seccion "Sobre Nosotros" no me gusta nada, ni el tamaño d elas tarjetas ni la imagen de fondo ni los colores, puramente estetico (a demas la letra del titulo no es la misma que la de la home)
2. "Nuestras sucursales" tiene una animacion rarisima al cambiar el tema, sacarla y ampliar el titulo de la pagina.
}

PROLIJIDAD DEL CODIGO:
1. Unificar estilos en un unico archivo css
2. Unificar mejor los .js, cada html tiene muchos scripts y no se si esta tan bueno


PLUS --> Hacer que el catalogo no sea harcodeado sino que se muestre desde el back, (fijarme como tengo que hacer con las fotos)


📝 Lista de Tareas Cronológicas

🛠️ Fase 1: Base de Datos y Estructura
  ✅Agregar campos de activo e inactivo a los libros para la baja lógica.
  ✅Agregar más inserts coherentes de categorías y géneros literarios.
  ✅Unificar estilos en un único archivo CSS.
  Unificar mejor los archivos .js (reorganizar scripts por funcionalidad o pantalla).

🗑️ Fase 2: Implementación de la Baja Lógica
  Eliminar completamente el método de delete de Pedidos.
  Implementar la baja lógica de los pedidos (usando un campo como activo o estado).
  Eliminar el método de delete de Libros.
  Implementar la baja lógica de Libros (usando los campos activo/inactivo creados en el punto 2).

🔒 Fase 3: Validación y Corrección de Formularios
  Corregir la validación para que la fecha de entrega no pueda ser anterior a hoy.
  Agregar notificación o validación para evitar inserciones si se deja un campo en blanco al agregar un libro.
  Agregar notificación de pedidos y libros creados correctamente
  Agregar notificacion ¿Esta seguro que desea eliminar esto/modificar esto otro?
  
🔎 Fase 4: Optimización de Vistas y Filtros
  Corregir el comportamiento de los combos de Libros (carga, y asegurar la lógica de negocio para la selección simple o múltiple).
  Corregir la funcionalidad de "ver" (el ojito) y "eliminar" (baja lógica) en la vista de Libros.
  Agregar paginado a la vista de Pedidos.
  Agregar paginado a la vista de Libros.
  Implementar mejoras de filtros en Pedidos:
       Filtrar por rango de fecha (no solo por día específico).
       Filtrar por forma de envío y/o estado.
       Filtrar por número de pedido.
  Mejorar filtro de cliente (usuario, nombre/apellido o DNI).
  Agregar filtros por año de publicación y por editorial.
  Quitar la columna vacía y sobrante en la vista "Ver Pedidos".

✨ Fase 5: Estética y Diseño (UX)
ESTETICO (1): Rediseñar la sección "Sobre Nosotros" (cambiar tamaño de tarjetas, imagen de fondo, colores, y unificar tipografía del título con la home).

ESTETICO (2): Corregir la sección "Nuestras sucursales" (quitar la animación al cambiar el tema y ampliar el título de la página).


🚀 Fase 6: Plus/Funcionalidad Mayor
PLUS: Hacer que el catálogo no sea hardcodeado, sino que se muestre desde el back-end (incluir la gestión de las fotos).

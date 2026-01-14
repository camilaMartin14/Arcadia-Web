# 📚 Arcadia — E‑commerce de Libros

Arcadia es una aplicación e‑commerce orientada al mundo editorial que resuelve de punta a punta el flujo de venta de libros: desde el catálogo navegable hasta la gestión de pedidos y su seguimiento. Está desarrollada con .NET y SQL Server en el backend, y HTML, CSS y JavaScript en el frontend.

El proyecto fue desarrollado como **proyecto integrador** del primer año de la Tecnicatura Universitaria en Programación, consolidando conocimientos de POO, modelado de bases de datos relacionales, arquitectura en capas y trabajo en equipo.

## ¿Qué problema resuelve?
- Centraliza el catálogo de libros en un único lugar, con fichas detalladas y filtros pensados para usuarios finales.
- Estandariza el proceso de toma de pedidos, evitando inconsistencias entre lo que se vende y lo que está realmente disponible.
- Aporta visibilidad al negocio mediante un dashboard con métricas de ventas que permiten tomar decisiones informadas.

## Funcionalidades principales
- Catálogo de libros con filtros y detalles extendidos
- Gestión de pedidos y relaciones transaccionales
- ABMC de libros, autores y editoriales
- Login y registro con validaciones server-side
- Autenticación y autorización mediante JWT
- Dashboard con métricas básicas de ventas

## Tecnologías y arquitectura
- Backend: .NET Web API, SQL Server, JWT  
- Frontend: HTML, CSS, JavaScript  

La API está organizada siguiendo una arquitectura en capas (controladores, servicios, repositorios y modelos/DTOs), lo que facilita la mantenibilidad, la evolución de reglas de negocio y la incorporación de nuevas integraciones.

## Roadmap y próximas mejoras

Arcadia está pensada para seguir creciendo tanto a nivel de producto como técnico. Entre las próximas modificaciones planificadas se incluyen:

- **Mejoras en la transaccionalidad de los pedidos**  
  Refuerzo de la consistencia de datos mediante el uso más intensivo de transacciones a nivel de base de datos y patrones de unidad de trabajo, para asegurar que pedidos y sus detalles se confirmen o deshagan de forma atómica.

- **Evolución de las reglas de negocio**  
  Refinamiento de validaciones y del ciclo de vida de los pedidos (estados, cancelaciones, reintentos, etc.), con una capa de dominio más rica que represente mejor los casos reales del negocio editorial.

- **Perfiles diferenciados: administrador y cliente**  
  Incorporación de distintos perfiles de usuario:
  - Perfil **administrador**: gestión avanzada de catálogo, pedidos, clientes y métricas del dashboard.  
  - Perfil **cliente**: experiencia de compra simplificada, historial de pedidos y seguimiento del estado de cada compra.  
  Esto se apoyará en el esquema de autenticación y autorización ya existente con JWT.

- **Gestión de portadas con MinIO**  
  Integración con **MinIO** como solución de object storage para almacenar las imágenes de las portadas de los libros.  
  Cada portada estará asociada a su registro en la base de datos, garantizando que la foto que ve el usuario en el catálogo sea la que corresponde al libro almacenado en el sistema.

## 🚀 Demo
🌐 **Deploy (Frontend):** https://arcadia-mu-five.vercel.app 



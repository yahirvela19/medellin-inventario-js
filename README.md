# Medellín & Co. — Inventario de joyería

Aplicación web del lado del cliente para administrar el inventario de una joyería. Permite registrar, consultar, editar y eliminar productos sin depender de un servidor: la información se guarda en el navegador con `localStorage` y se conserva entre sesiones.

Actividad 3 — *Aplicación interactiva con JavaScript moderno*
Laboratorio de Programación Web · FIME UANL

**Demo:** https://yahirvela19.github.io/medellin-inventario-js/

## Funcionalidades

- **Agregar, visualizar, editar y eliminar** productos (nombre, SKU, categoría, precio, stock y ubicación).
- **Validación** de cada campo antes de guardar, con mensajes debajo del campo con error:
  - Nombre de 3 a 60 caracteres.
  - SKU con formato `ABC-123` y sin duplicados.
  - Categoría obligatoria.
  - Precio mayor que 0 con máximo dos decimales.
  - Stock entero de 0 o más.
- **Persistencia** con `localStorage`: los cambios se guardan automáticamente y se recuperan al volver a abrir la página.
- **Búsqueda** por nombre o SKU en tiempo real.
- **Filtro** por categoría y por productos con stock bajo (menos de 5 unidades).
- **Ordenamiento** por fecha, nombre, precio o stock.
- **Cálculos automáticos**: total de productos, unidades en stock, valor del inventario, productos con stock bajo y valor por categoría.
- **Ajuste rápido de stock** con botones − / + en cada fila.
- Confirmación antes de eliminar y notificaciones de cada operación.
- Diseño responsivo para computadora, tableta y celular.

## Tecnologías

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura semántica, formulario y elemento `<dialog>` |
| CSS3 | Variables, Grid, Flexbox y media queries |
| JavaScript ES6+ | Lógica, manipulación del DOM, eventos y `localStorage` |
| Git y GitHub | Control de versiones y publicación con GitHub Pages |

## Cómo ejecutarlo

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/yahirvela19/medellin-inventario-js.git
   ```
2. Abrir `index.html` en el navegador (doble clic). No requiere instalación ni servidor.

La primera vez se cargan siete productos de ejemplo. El botón **Restablecer datos de ejemplo** vuelve a ese estado.

## Estructura del proyecto

```
medellin-inventario-js/
├── index.html        Estructura de la página
├── css/
│   └── styles.css    Estilos
├── js/
│   └── app.js        Lógica de la aplicación
└── README.md
```

## Modelo de datos

Cada producto es un objeto dentro del arreglo `productos`:

```js
{
  id: "lq3x9k-a8f2c1",      // identificador único
  sku: "ANI-001",
  nombre: "Anillo de oro 18k",
  categoria: "Anillo",
  precio: 4500,
  stock: 12,
  ubicacion: "Vitrina A1",
  creado: 1731880000000,     // fecha de alta (ms)
  actualizado: 1731880000000 // última modificación (ms)
}
```

El arreglo completo se guarda como JSON en `localStorage` con la clave `medellin-inventario-v1`.

## Organización de `app.js`

| Sección | Contenido |
|---|---|
| 1. Estado | Constantes, arreglo `productos`, filtros y referencias al DOM |
| 2. Persistencia | `guardar()` y `cargar()` con `localStorage` y `JSON` |
| 3. Validación | `leerFormulario()`, `validar()` y `mostrarErrores()` |
| 4. Operaciones | `agregarProducto()`, `actualizarProducto()`, `eliminarProducto()`, `ajustarStock()` |
| 5. Consultas | Búsqueda, filtros y ordenamiento con `filter()` y `sort()` |
| 6. Renderizado | Creación de filas con `createElement`, totales con `reduce()` |
| 7. Formulario | Cambio entre modo agregar y modo editar |
| 8. Notificaciones | Mensajes temporales y diálogo de confirmación |
| 9. Eventos | `submit`, `click` con delegación de eventos, `input`, `change` y `blur` |
| 10. Inicio | Carga de datos y primer renderizado |

## Requisitos de la actividad

| Requisito | Dónde se cumple |
|---|---|
| Modelar datos con objetos y arreglos | Arreglo `productos` de objetos; uso de `map`, `filter`, `find`, `some`, `reduce` y `sort` |
| Agregar, visualizar, editar y eliminar | Secciones 4, 6 y 7 de `app.js` |
| Manipular el DOM sin recargar | `render()` reconstruye la tabla y los indicadores con `createElement` y `replaceChildren` |
| Eventos y funciones; sintaxis moderna | `let`/`const`, template literals, funciones flecha, desestructuración, operador spread, `??` y `async/await` |
| Validar datos con mensajes claros | `validar()` y `mostrarErrores()`; los campos con error se marcan en rojo |
| Guardar y recuperar con `localStorage` | `guardar()` y `cargar()` |
| Función adicional | Búsqueda, filtros, ordenamiento, contador de stock bajo y cálculo automático del valor del inventario |

/* =========================================================
   Medellín & Co. — Inventario de joyería
   JavaScript ES6+: objetos, arreglos, DOM, eventos,
   validación y persistencia con localStorage.
   ========================================================= */

'use strict';

// ---------------------------------------------------------
// 1. Constantes y estado de la aplicación
// ---------------------------------------------------------
const CLAVE_STORAGE = 'medellin-inventario-v1';
const STOCK_BAJO = 5;
const CATEGORIAS = ['Anillo', 'Collar', 'Arete', 'Pulsera', 'Dije', 'Reloj'];

const DATOS_EJEMPLO = [
  { sku: 'ANI-001', nombre: 'Anillo de oro 18k', categoria: 'Anillo', precio: 4500, stock: 12, ubicacion: 'Vitrina A1' },
  { sku: 'COL-001', nombre: 'Collar de plata 925', categoria: 'Collar', precio: 1200, stock: 25, ubicacion: 'Vitrina B2' },
  { sku: 'ARE-001', nombre: 'Aretes de perla', categoria: 'Arete', precio: 850, stock: 18, ubicacion: 'Vitrina C1' },
  { sku: 'PUL-001', nombre: 'Pulsera de oro 14k', categoria: 'Pulsera', precio: 3200, stock: 3, ubicacion: 'Vitrina A3' },
  { sku: 'DIJ-001', nombre: 'Dije corazón de plata', categoria: 'Dije', precio: 650, stock: 30, ubicacion: 'Vitrina D1' },
  { sku: 'ANI-002', nombre: 'Anillo de compromiso 0.5ct', categoria: 'Anillo', precio: 18500, stock: 4, ubicacion: 'Caja fuerte' },
  { sku: 'COL-002', nombre: 'Collar tennis de diamantes', categoria: 'Collar', precio: 25000, stock: 2, ubicacion: 'Caja fuerte' },
];

// Estado: un arreglo de objetos producto + filtros actuales
let productos = [];
let idEnEdicion = null;
const filtros = { texto: '', categoria: '', orden: 'recientes', soloBajo: false };

// Referencias a elementos del DOM
const $ = (selector) => document.querySelector(selector);

const ui = {
  form: $('#form-producto'),
  formCard: $('.form-card'),
  formTitulo: $('#form-title'),
  btnGuardar: $('#btn-guardar'),
  btnCancelar: $('#btn-cancelar'),
  btnReset: $('#btn-reset'),
  campos: {
    nombre: $('#campo-nombre'),
    sku: $('#campo-sku'),
    categoria: $('#campo-categoria'),
    precio: $('#campo-precio'),
    stock: $('#campo-stock'),
    ubicacion: $('#campo-ubicacion'),
  },
  tabla: $('#tabla-cuerpo'),
  vacio: $('#estado-vacio'),
  contador: $('#contador'),
  resumen: $('#resumen-categorias'),
  busqueda: $('#filtro-busqueda'),
  filtroCategoria: $('#filtro-categoria'),
  orden: $('#filtro-orden'),
  soloBajo: $('#filtro-bajo'),
  dialogo: $('#dialogo-eliminar'),
  dialogoTexto: $('#dialogo-texto'),
  toasts: $('#toasts'),
  stats: {
    productos: $('#stat-productos'),
    unidades: $('#stat-unidades'),
    valor: $('#stat-valor'),
    bajo: $('#stat-bajo'),
  },
};

const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// ---------------------------------------------------------
// 2. Persistencia con localStorage
// ---------------------------------------------------------
const crearId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const conMetadatos = (datos) => {
  const ahora = Date.now();
  return datos.map((p, i) => ({ ...p, id: crearId(), creado: ahora - i * 1000, actualizado: ahora - i * 1000 }));
};

function guardar() {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(productos));
  } catch (error) {
    mostrarToast('No se pudo guardar en este navegador.', 'error');
  }
}

function cargar() {
  try {
    const texto = localStorage.getItem(CLAVE_STORAGE);
    if (texto === null) return conMetadatos(DATOS_EJEMPLO); // primera visita
    const datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return conMetadatos(DATOS_EJEMPLO);
  }
}

// ---------------------------------------------------------
// 3. Validación
// ---------------------------------------------------------
const PATRON_SKU = /^[A-Z]{3}-\d{3}$/;

function leerFormulario() {
  const { nombre, sku, categoria, precio, stock, ubicacion } = ui.campos;
  return {
    nombre: nombre.value.trim(),
    sku: sku.value.trim().toUpperCase(),
    categoria: categoria.value,
    precio: precio.value.trim(),
    stock: stock.value.trim(),
    ubicacion: ubicacion.value.trim(),
  };
}

function validar(datos) {
  const errores = {};

  if (datos.nombre.length < 3) {
    errores.nombre = 'El nombre debe tener al menos 3 caracteres.';
  } else if (datos.nombre.length > 60) {
    errores.nombre = 'El nombre no puede pasar de 60 caracteres.';
  }

  if (!PATRON_SKU.test(datos.sku)) {
    errores.sku = 'Usa el formato ABC-123 (tres letras, guion y tres números).';
  } else if (productos.some((p) => p.sku === datos.sku && p.id !== idEnEdicion)) {
    errores.sku = `El SKU ${datos.sku} ya está registrado.`;
  }

  if (!CATEGORIAS.includes(datos.categoria)) {
    errores.categoria = 'Selecciona una categoría.';
  }

  const precio = Number(datos.precio);
  if (datos.precio === '' || Number.isNaN(precio)) {
    errores.precio = 'Escribe el precio.';
  } else if (precio <= 0) {
    errores.precio = 'El precio debe ser mayor que 0.';
  } else if (!/^\d+(\.\d{1,2})?$/.test(datos.precio)) {
    errores.precio = 'Usa como máximo dos decimales.';
  }

  const stock = Number(datos.stock);
  if (datos.stock === '' || !Number.isInteger(stock) || stock < 0) {
    errores.stock = 'El stock debe ser un número entero de 0 o más.';
  }

  if (datos.ubicacion.length > 40) {
    errores.ubicacion = 'La ubicación no puede pasar de 40 caracteres.';
  }

  return errores;
}

function mostrarErrores(errores) {
  Object.entries(ui.campos).forEach(([campo, input]) => {
    const mensaje = errores[campo] ?? '';
    $(`#error-${campo}`).textContent = mensaje;
    input.setAttribute('aria-invalid', mensaje ? 'true' : 'false');
  });

  // enfocar el primer campo con error
  const primero = Object.keys(ui.campos).find((campo) => errores[campo]);
  if (primero) ui.campos[primero].focus();
}

// ---------------------------------------------------------
// 4. Operaciones: agregar, editar, eliminar
// ---------------------------------------------------------
function agregarProducto(datos) {
  const ahora = Date.now();
  const nuevo = {
    id: crearId(),
    ...datos,
    precio: Number(datos.precio),
    stock: Number(datos.stock),
    creado: ahora,
    actualizado: ahora,
  };
  productos = [nuevo, ...productos];
  return nuevo;
}

function actualizarProducto(id, datos) {
  productos = productos.map((p) =>
    p.id === id
      ? { ...p, ...datos, precio: Number(datos.precio), stock: Number(datos.stock), actualizado: Date.now() }
      : p
  );
  return productos.find((p) => p.id === id);
}

function eliminarProducto(id) {
  const eliminado = productos.find((p) => p.id === id);
  productos = productos.filter((p) => p.id !== id);
  return eliminado;
}

function ajustarStock(id, cambio) {
  productos = productos.map((p) =>
    p.id === id ? { ...p, stock: Math.max(0, p.stock + cambio), actualizado: Date.now() } : p
  );
}

// ---------------------------------------------------------
// 5. Búsqueda, filtro y ordenamiento
// ---------------------------------------------------------
const comparadores = {
  recientes: (a, b) => b.creado - a.creado,
  nombre: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  'precio-asc': (a, b) => a.precio - b.precio,
  'precio-desc': (a, b) => b.precio - a.precio,
  'stock-asc': (a, b) => a.stock - b.stock,
};

function obtenerVisibles() {
  const texto = filtros.texto.toLowerCase();

  return productos
    .filter((p) => !texto || p.nombre.toLowerCase().includes(texto) || p.sku.toLowerCase().includes(texto))
    .filter((p) => !filtros.categoria || p.categoria === filtros.categoria)
    .filter((p) => !filtros.soloBajo || p.stock < STOCK_BAJO)
    .sort(comparadores[filtros.orden]);
}

// ---------------------------------------------------------
// 6. Renderizado (manipulación del DOM)
// ---------------------------------------------------------
function crearFila(producto) {
  const fila = document.createElement('tr');
  fila.dataset.id = producto.id;
  if (producto.id === idEnEdicion) fila.classList.add('is-editing');

  const esBajo = producto.stock < STOCK_BAJO;

  fila.innerHTML = `
    <td>
      <div class="product__name"></div>
      <div class="product__sku"></div>
    </td>
    <td><span class="badge"></span></td>
    <td class="num">${formatoMoneda.format(producto.precio)}</td>
    <td class="num">
      <span class="stock">
        <button class="stepper" type="button" data-accion="restar" aria-label="Restar una unidad"
          ${producto.stock === 0 ? 'disabled' : ''}>−</button>
        <span class="stock__value ${esBajo ? 'is-low' : ''}">${producto.stock}</span>
        <button class="stepper" type="button" data-accion="sumar" aria-label="Sumar una unidad">+</button>
      </span>
    </td>
    <td class="ubicacion"></td>
    <td>
      <div class="row-actions">
        <button class="btn btn--link" type="button" data-accion="editar">Editar</button>
        <button class="btn btn--link is-danger" type="button" data-accion="eliminar">Eliminar</button>
      </div>
    </td>`;

  // textContent para los campos escritos por el usuario (evita inyectar HTML)
  fila.querySelector('.product__name').textContent = producto.nombre;
  fila.querySelector('.product__sku').textContent = producto.sku;
  fila.querySelector('.badge').textContent = producto.categoria;
  fila.querySelector('.ubicacion').textContent = producto.ubicacion || '—';

  return fila;
}

function renderTabla() {
  const visibles = obtenerVisibles();

  ui.tabla.replaceChildren(...visibles.map(crearFila));
  ui.vacio.hidden = visibles.length > 0;
  ui.contador.textContent = `${visibles.length} de ${productos.length} productos`;
}

function renderEstadisticas() {
  const unidades = productos.reduce((total, p) => total + p.stock, 0);
  const valor = productos.reduce((total, p) => total + p.precio * p.stock, 0);
  const bajos = productos.filter((p) => p.stock < STOCK_BAJO).length;

  ui.stats.productos.textContent = productos.length;
  ui.stats.unidades.textContent = unidades.toLocaleString('es-MX');
  ui.stats.valor.textContent = formatoMoneda.format(valor);
  ui.stats.bajo.textContent = bajos;
}

function renderResumenCategorias() {
  const porCategoria = productos.reduce((acumulado, p) => {
    acumulado[p.categoria] = (acumulado[p.categoria] ?? 0) + p.precio * p.stock;
    return acumulado;
  }, {});

  const elementos = Object.entries(porCategoria)
    .sort(([, a], [, b]) => b - a)
    .map(([categoria, valor]) => {
      const item = document.createElement('span');
      item.className = 'summary__item';
      item.innerHTML = `${categoria}: <strong>${formatoMoneda.format(valor)}</strong>`;
      return item;
    });

  ui.resumen.replaceChildren(...elementos);
}

function render() {
  renderTabla();
  renderEstadisticas();
  renderResumenCategorias();
}

function llenarCategorias() {
  const opciones = CATEGORIAS.map((c) => `<option value="${c}">${c}</option>`).join('');
  ui.campos.categoria.insertAdjacentHTML('beforeend', opciones);
  ui.filtroCategoria.insertAdjacentHTML('beforeend', opciones);
}

// ---------------------------------------------------------
// 7. Formulario: modo agregar / modo editar
// ---------------------------------------------------------
function modoAgregar() {
  idEnEdicion = null;
  ui.form.reset();
  mostrarErrores({});
  ui.formTitulo.textContent = 'Agregar producto';
  ui.btnGuardar.textContent = 'Agregar producto';
  ui.btnCancelar.hidden = true;
  ui.formCard.classList.remove('is-editing');
}

function modoEditar(id) {
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;

  idEnEdicion = id;
  Object.entries(ui.campos).forEach(([campo, input]) => {
    input.value = producto[campo] ?? '';
  });
  mostrarErrores({});
  ui.formTitulo.textContent = 'Editar producto';
  ui.btnGuardar.textContent = 'Guardar cambios';
  ui.btnCancelar.hidden = false;
  ui.formCard.classList.add('is-editing');
  ui.campos.nombre.focus();
  renderTabla();
}

// ---------------------------------------------------------
// 8. Notificaciones y confirmación
// ---------------------------------------------------------
function mostrarToast(mensaje, tipo = 'ok') {
  const toast = document.createElement('div');
  toast.className = `toast ${tipo === 'error' ? 'toast--error' : ''}`;
  toast.textContent = mensaje;
  ui.toasts.append(toast);
  setTimeout(() => toast.remove(), 3000);
}

function confirmarEliminacion(producto) {
  return new Promise((resolver) => {
    ui.dialogoTexto.textContent = `¿Eliminar "${producto.nombre}" (${producto.sku})? Esta acción no se puede deshacer.`;
    ui.dialogo.returnValue = '';
    ui.dialogo.showModal();
    ui.dialogo.addEventListener('close', () => resolver(ui.dialogo.returnValue === 'confirmar'), { once: true });
  });
}

// ---------------------------------------------------------
// 9. Eventos
// ---------------------------------------------------------
ui.form.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const datos = leerFormulario();
  const errores = validar(datos);
  mostrarErrores(errores);

  if (Object.keys(errores).length > 0) {
    mostrarToast('Revisa los campos marcados.', 'error');
    return;
  }

  if (idEnEdicion) {
    const actualizado = actualizarProducto(idEnEdicion, datos);
    mostrarToast(`Se actualizó "${actualizado.nombre}".`);
  } else {
    const nuevo = agregarProducto(datos);
    mostrarToast(`Se agregó "${nuevo.nombre}".`);
  }

  guardar();
  modoAgregar();
  render();
});

ui.btnCancelar.addEventListener('click', () => {
  modoAgregar();
  renderTabla();
});

// Validación en vivo: al salir de un campo con error, se revisa de nuevo
Object.entries(ui.campos).forEach(([campo, input]) => {
  input.addEventListener('blur', () => {
    if (input.getAttribute('aria-invalid') !== 'true') return;
    const errores = validar(leerFormulario());
    $(`#error-${campo}`).textContent = errores[campo] ?? '';
    input.setAttribute('aria-invalid', errores[campo] ? 'true' : 'false');
  });
});

// Delegación de eventos: un solo listener para todos los botones de la tabla
ui.tabla.addEventListener('click', async (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const id = boton.closest('tr').dataset.id;
  const accion = boton.dataset.accion;

  if (accion === 'editar') {
    modoEditar(id);
  } else if (accion === 'eliminar') {
    const producto = productos.find((p) => p.id === id);
    if (await confirmarEliminacion(producto)) {
      eliminarProducto(id);
      if (idEnEdicion === id) modoAgregar();
      guardar();
      render();
      mostrarToast(`Se eliminó "${producto.nombre}".`);
    }
  } else if (accion === 'sumar' || accion === 'restar') {
    ajustarStock(id, accion === 'sumar' ? 1 : -1);
    guardar();
    render();
  }
});

// Filtros
ui.busqueda.addEventListener('input', (e) => { filtros.texto = e.target.value.trim(); renderTabla(); });
ui.filtroCategoria.addEventListener('change', (e) => { filtros.categoria = e.target.value; renderTabla(); });
ui.orden.addEventListener('change', (e) => { filtros.orden = e.target.value; renderTabla(); });
ui.soloBajo.addEventListener('change', (e) => { filtros.soloBajo = e.target.checked; renderTabla(); });

// Restablecer datos de ejemplo
ui.btnReset.addEventListener('click', () => {
  productos = conMetadatos(DATOS_EJEMPLO);
  guardar();
  modoAgregar();
  render();
  mostrarToast('Se restablecieron los datos de ejemplo.');
});

// ---------------------------------------------------------
// 10. Inicio
// ---------------------------------------------------------
llenarCategorias();
productos = cargar();
guardar();
render();

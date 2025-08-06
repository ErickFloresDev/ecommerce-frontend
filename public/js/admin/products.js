(function () {
  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);

    if (response.status === 401 || response.status === 403){
      // Token vencido o acceso prohibido
      localStorage.clear();             // Limpia token, rol, etc.
      window.location.href = '/login';  // Redirige automáticamente
      // Opcional: lanzar un error para romper la cadena de promesas
      throw new Error('Unauthorized: redirigiendo a login');
    }

    return response;
  };
})();

const baseUrl = 'http://localhost:3000/api';
let allProducts = [];
let currentStatus = 'active';

let filteredProducts = [];  // productos que se muestran actualmente (filtrados o no)
let currentPage = 1;
const rowsPerPage = 10;

window.addEventListener('DOMContentLoaded', () => {
  // — Seguridad
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');
  if (!token || role !== 'administrador') {
    localStorage.clear();
    return window.location.href = '/login';
  }

  showNotification(`¡Bienvenido a productos, ${name}!`);

  // — Listar activos/inactivos
  document.getElementById('btnActive').onclick = () => loadProducts('active');
  document.getElementById('btnInactive').onclick = () => loadProducts('inactive');

  // — Nuevo producto
  document.getElementById('btnNew').onclick = () => openFormModal();

  // — Buscador
  document.getElementById('search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();

    if (!q) {
      filteredProducts = allProducts;
    } else {
      filteredProducts = allProducts.filter(p =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q) ||
        (p.brand ?? '').toLowerCase().includes(q)
      );
    }

    currentPage = 1;
    renderTable();
  });


  // — Submit form (crear / editar)
  document.getElementById('productForm').addEventListener('submit', onFormSubmit);

  // Inicializar
  loadProducts('active');
});

async function loadProducts(status) {
  currentStatus = status;

  // toggle botones
  ['Active', 'Inactive'].forEach(s => {
    const btn = document.getElementById('btn' + s);
    btn.classList.toggle('btn-primary', s.toLowerCase() === status);
    btn.classList.toggle('btn-secondary', s.toLowerCase() !== status);
  });

  try {
    const url = `${baseUrl}/products${status === 'inactive' ? '/inactive' : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const body = await res.json();
    allProducts = body.products || [];
    filteredProducts = allProducts; // reinicia filtro
    currentPage = 1;                // reinicia paginación
    renderTable();
  } catch {
    alert('Error cargando productos');
  }
}

// — Render tabla
function renderTable() {
  const tbody = document.querySelector('#productsTable tbody');
  const pagination = document.getElementById('pagination');

  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageProducts = filteredProducts.slice(start, end);

  tbody.innerHTML = '';
  pageProducts.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-3"><img src="${p.images_url}" width="50"/></td>
      <td class="row-table-css p-3">${p.name} <br> <span class="description-table">${p.description}</span></td>
      <td class="row-table-css p-3">${p.brand}</td>
      <td class="row-table-css p-3">${p.category}</td>
      <td class="row-table-css p-3">${p.price_start.toFixed(2)}</td>
      <td class="row-table-css p-3">${p.price_end.toFixed(2)}</td>
      <td class="row-table-css p-3">${p.stock} (${p.message_stock})</td>
      <td class="row-table-css p-3">${p.status}</td>
      <td class="p-3">
        <button class="btn-outline-dark-boton preview-btn" data-id="${p.id_product}"><i class="fas fa-eye"></i></button>
        <button class="btn-outline-dark-boton edit-btn" data-id="${p.id_product}"><i class="fas fa-edit"></i></button>
        ${p.status === 'active'
        ? `<button class="btn-outline-dark-boton delete-btn" data-id="${p.id_product}"><i class="fas fa-trash-alt"></i></button>`
        : `<button class="btn-outline-dark-boton restore-btn" data-id="${p.id_product}"><i class="fas fa-undo"></i></button>`
      }
      </td>`;
    tbody.appendChild(tr);
  });

  // eventos
  tbody.querySelectorAll('.preview-btn').forEach(b => b.onclick = onPreview);
  tbody.querySelectorAll('.edit-btn').forEach(b => b.onclick = onEdit);
  tbody.querySelectorAll('.delete-btn').forEach(b => b.onclick = onDelete);
  tbody.querySelectorAll('.restore-btn').forEach(b => b.onclick = onRestore);

  // paginación
  pagination.innerHTML = '';

  const prev = document.createElement('li');
  prev.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prev.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };
  pagination.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.onclick = () => {
      currentPage = i;
      renderTable();
    };
    pagination.appendChild(li);
  }

  const next = document.createElement('li');
  next.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  next.innerHTML = `<a class="page-link" href="#">Siguiente</a>`;
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };
  pagination.appendChild(next);
}

// — Preview
async function onPreview(e) {
  const id = e.currentTarget.dataset.id;
  const res = await fetch(`${baseUrl}/products/${id}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const { product } = await res.json();
  document.getElementById('modalContent').innerHTML = `
    <div class="row">
      <div class="col-md-4">
        <img src="${product.images_url}" class="img-fluid"/>
      </div>
      <div class="col-md-8">
        <h5>${product.name}</h5>
        <p><strong>Marca:</strong> ${product.brand}</p>
        <p><strong>Categoría:</strong> ${product.category}</p>
        <p><strong>Precio:</strong> ${product.price_start} - ${product.price_end}</p>
        <p><strong>Stock:</strong> ${product.stock} (${product.message_stock})</p>
        <p><strong>Descripción:</strong> ${product.description}</p>
      </div>
    </div>`;
  new bootstrap.Modal(document.getElementById('previewModal')).show();
}

// — Abrir modal form (crear o editar)
function openFormModal(product = null) {
  const form = document.getElementById('productForm');
  form.reset();
  form.querySelector('#images_url').value = ''; // limpia input file
  document.getElementById('id_product').value = product?.id_product || '';

  document.getElementById('formModalLabel').textContent =
    product ? 'Editar producto' : 'Nuevo producto';
  document.getElementById('submitBtn').textContent =
    product ? 'Actualizar' : 'Crear';

  if (product) {
    // pre-llenar
    ['name', 'brand', 'description', 'price_start', 'price_end', 'category', 'stock', 'message_stock']
      .forEach(key => document.getElementById(key).value = product[key]);
  }
  new bootstrap.Modal(document.getElementById('formModal')).show();
}

// — Clic en “Editar”
async function onEdit(e) {
  const id = e.currentTarget.dataset.id;
  const res = await fetch(`${baseUrl}/products/${id}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const { product } = await res.json();
  openFormModal(product);
}

// — Enviar formulario
async function onFormSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const id = form.id_product.value;   // === '' en creación
  const url = id
    ? `${baseUrl}/products/${id}`
    : `${baseUrl}/products`;
  const method = id ? 'PUT' : 'POST';

  const fd = new FormData(form);

  // <-- Añade esto -->
  if (!id) {
    fd.delete('id_product');
  }

  // si es edición y no cambiaste imagen, la borras
  if (id && !fd.get('images_url').size) {
    fd.delete('images_url');
  }

  await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: fd
  });

  bootstrap.Modal.getInstance(
    document.getElementById('formModal')
  ).hide();

  loadProducts(currentStatus);
  
  // Aquí agregamos las notificaciones
  if (id) {
    showNotification("Producto editado");
  } else {
    showNotification("Producto creado");
  }
}


// — Borrar lógico
async function onDelete(e) {
  const id = e.currentTarget.dataset.id;
  await fetch(`${baseUrl}/products/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  
  loadProducts(currentStatus);
  showNotification("Producto eliminado");
}

// — Restaurar
async function onRestore(e) {
  const id = e.currentTarget.dataset.id;
  await fetch(`${baseUrl}/products/${id}/restore`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  loadProducts(currentStatus);
  showNotification("Producto restaurado");
}

// Función para mostrar notificaciones (opcional)
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #000000;
    color: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 4px;
    z-index: 9999;
    font-size: 0.9rem;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);

}

// Toggle navbar
const navToggler = document.querySelector('.navbar-toggler');
const navTogglerIcon = document.getElementById('navTogglerIcon');

if (navToggler && navTogglerIcon) {
  navToggler.addEventListener('click', () => {
    navTogglerIcon.classList.toggle('fa-bars');
    navTogglerIcon.classList.toggle('fa-times');
  });
}
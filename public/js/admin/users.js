(function () {
  const _fetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await _fetch.apply(this, args);

    if (response.status === 401 || response.status === 403) {
      // Token vencido o acceso prohibido
      localStorage.clear();             // Limpia token, rol, etc.
      window.location.href = '/login';  // Redirige automáticamente
      // Opcional: lanzar un error para romper la cadena de promesas
      throw new Error('Unauthorized: redirigiendo a login');
    }

    return response;
  };
})();


const baseUrl = `${CONFIG.API_URL}`;
let allUsers = [];
let filteredUsers = []; 
let currentStatus = 'active';

let currentPage = 1;
const rowsPerPage = 10;

window.addEventListener('DOMContentLoaded', () => {
  // — Seguridad
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');
  const name  = localStorage.getItem('name');
  if (!token || role !== 'administrador') {
    localStorage.clear();
    return window.location.href = '/login';
  }

  showNotification(`¡Bienvenido a usuarios, ${name}!`);

  // — Controles
  document.getElementById('btnActive').onclick    = () => loadUsers('active');
  document.getElementById('btnInactive').onclick  = () => loadUsers('inactive');
  document.getElementById('btnNewAdmin').onclick  = () => openUserFormModal();
  document.getElementById('search').oninput       = onSearch;
  document.getElementById('userForm').onsubmit    = onFormSubmit;

  loadUsers('active');
});

// — Carga lista de usuarios segun estado
async function loadUsers(status) {
  currentStatus = status;
  ['Active','Inactive'].forEach(s => {
    const btn = document.getElementById('btn'+s);
    btn.classList.toggle('btn-primary', s.toLowerCase()===status);
    btn.classList.toggle('btn-secondary', s.toLowerCase()!==status);
  });

  const url = `${baseUrl}/users${status==='inactive'?'/inactive':''}`;
  const res = await fetch(url, { headers:{ 'Authorization':`Bearer ${localStorage.getItem('token')}` }});
  const body = await res.json();
  allUsers = body.users || [];
  filteredUsers = allUsers;
  currentPage = 1;
  renderTable();
}

// — Renderiza tabla
function renderTable() {
  const tbody = document.querySelector('#usersTable tbody');
  const pagination = document.getElementById('pagination');

  const users = filteredUsers;
  const totalPages = Math.ceil(users.length / rowsPerPage);
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageUsers = users.slice(start, end);
  
  tbody.innerHTML = '';
  pageUsers.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="row-table-css p-3"><i class="fa-solid fa-user"></i></td>
      <td class="row-table-css p-3">${u.name} <br> <span class="description-table">${u.email}</span></td>
      <td class="row-table-css p-3">${u.phone}</td>
      <td class="row-table-css p-3">${u.address}</td>
      <td class="row-table-css p-3">${u.role}</td>
      <td class="row-table-css p-3">${u.status}</td>
      <td class="row-table-css p-3">
        <button class="btn-outline-dark-boton edit-btn" data-id="${u.id_user}"><i class="fas fa-edit"></i></button>
        ${
          u.status==='active'
          ? `<button class="btn-outline-dark-boton delete-btn"  data-id="${u.id_user}"><i class="fas fa-trash-alt"></i></button>`
          : `<button class="btn-outline-dark-boton restore-btn" data-id="${u.id_user}"><i class="fas fa-undo"></i></button>`
        }
      </td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.edit-btn').forEach(b => b.onclick    = onEdit);
  tbody.querySelectorAll('.delete-btn').forEach(b => b.onclick  = onDelete);
  tbody.querySelectorAll('.restore-btn').forEach(b => b.onclick = onRestore);

  // Render paginación
  pagination.innerHTML = '';

  const prev = document.createElement('li');
  prev.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prev.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
  prev.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable(users);
    }
  };
  pagination.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.onclick = () => {
      currentPage = i;
      renderTable(users);
    };
    pagination.appendChild(li);
  }

  const next = document.createElement('li');
  next.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  next.innerHTML = `<a class="page-link" href="#">Siguiente</a>`;
  next.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable(users);
    }
  };
  pagination.appendChild(next);
}

// — Buscador multi‐campo
function onSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    filteredUsers = allUsers; // vuelve a mostrar todo
  } else {
    filteredUsers = allUsers.filter(u =>
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.role ?? '').toLowerCase().includes(q) ||
      (u.address ?? '').toLowerCase().includes(q) ||
      (u.phone ?? '').toLowerCase().includes(q)
    );
  }
  currentPage = 1;
  renderTable();
}


// — Abrir modal (crear Admin / editar User)
async function openUserFormModal(user=null) {
  const modalEl = document.getElementById('userFormModal');
  const ff      = document.getElementById('userForm');
  // reset
  ff.reset();
  document.getElementById('passwordGroup').style.display = 'none';
  document.getElementById('id_user').value = '';
  document.getElementById('role').value    = 'usuario';

  if (!user) {
    // Registrar Admin
    document.getElementById('userFormLabel').textContent = 'Registrar Administrador';
    document.getElementById('userSubmitBtn').textContent = 'Registrar';
    document.getElementById('role').value = 'administrador';
    document.getElementById('passwordGroup').style.display = 'block';
  } else {
    // Editar User
    document.getElementById('userFormLabel').textContent = 'Editar Usuario';
    document.getElementById('userSubmitBtn').textContent = 'Actualizar';
    document.getElementById('id_user').value    = user.id_user;
    document.getElementById('userName').value    = user.name;
    document.getElementById('userEmail').value   = user.email;
    document.getElementById('userAddress').value = user.address;
    document.getElementById('userPhone').value   = user.phone;
    document.getElementById('role').value        = user.role;
    // password oculto en edición
  }

  new bootstrap.Modal(modalEl).show();
}

// — Al hacer click en “Editar”
async function onEdit(e) {
  const id = e.currentTarget.dataset.id;
  const res = await fetch(`${baseUrl}/users/${id}`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  const { user } = await res.json();    // coincide con { user } en el controller
  openUserFormModal(user);
}


// — Submit del form (POST o PUT)
async function onFormSubmit(e) {
  e.preventDefault();
  const id    = document.getElementById('id_user').value;
  const isNew = !id;
  const url   = isNew ? `${baseUrl}/auth/register-admin` : `${baseUrl}/users/${id}`;
  const method= isNew ? 'POST' : 'PUT';

  // Construye payload JSON
  const payload = {
    name:    document.getElementById('userName').value,
    email:   document.getElementById('userEmail').value,
    address: document.getElementById('userAddress').value,
    phone:   document.getElementById('userPhone').value,
    role:    document.getElementById('role').value
  };
  if (isNew) {
    payload.password = document.getElementById('userPassword').value;
  }

  await fetch(url, {
    method,
    headers: {
      'Content-Type':'application/json',
      'Authorization':`Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(payload)
  });

  bootstrap.Modal.getInstance(
    document.getElementById('userFormModal')
  ).hide();

  loadUsers(currentStatus);

  showNotification("Usuario editado");
}

// — Soft‐delete
async function onDelete(e) {
  const id = e.currentTarget.dataset.id;
  await fetch(`${baseUrl}/users/${id}`, {
    method:'DELETE',
    headers: {
      'Content-Type':'application/json',
      'Authorization':`Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({})
  });
  loadUsers(currentStatus);

  showNotification("Usuario eliminado");
}

// — Restaurar
async function onRestore(e) {
  const id = e.currentTarget.dataset.id;
  await fetch(`${baseUrl}/users/${id}/restore`, {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${localStorage.getItem('token')}` }
  });
  loadUsers(currentStatus);

  showNotification("Usuario restaurado");
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
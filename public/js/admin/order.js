  // --- Interceptor global de fetch para 401 y 403 ---
  (function() {
    const _fetch = window.fetch;
    window.fetch = async function(...args) {
      const response = await _fetch.apply(this, args);
      if (response.status === 401 || response.status === 403) {
        // Token inválido, expirado o acceso prohibido
        localStorage.clear();
        window.location.href = '/login';
        throw new Error(`HTTP ${response.status}: redirigiendo a login`);
      }
      return response;
    };
  })();

  const baseUrl = `${CONFIG.API_URL}`;

  window.addEventListener('DOMContentLoaded', () => {
    // — Seguridad
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');
    const name  = localStorage.getItem('name');
    if (!token || role !== 'administrador') {
      localStorage.clear();
      return window.location.href = '/login';
    }
    showNotification(`¡Bienvenido a pedidos, ${name}!`);

    // — Variables y referencias
    let currentPath = '/orders';
    const tbody     = document.getElementById('orders-table-body');
    const searchIn  = document.getElementById('search-input');
    const modalEl   = new bootstrap.Modal(document.getElementById('orderModal'));
    const modalTitle= document.getElementById('modal-order-id');
    const detBody   = document.getElementById('order-details-body');

    // — Botones de filtro
    document.getElementById('filter-active').onclick = () => {
      currentPath = '/orders';
      loadAndRender(currentPath);
    };
    document.getElementById('filter-deleted').onclick = () => {
      currentPath = '/orders/deleted';
      loadAndRender(currentPath);
    };
    document.getElementById('filter-today').onclick = () => {
      currentPath = '/orders/today';
      loadAndRender(currentPath);
    };
    document.getElementById('filter-week').onclick = () => {
      currentPath = '/orders/week';
      loadAndRender(currentPath);
    };
    document.getElementById('filter-month').onclick = () => {
      currentPath = '/orders/month';
      loadAndRender(currentPath);
    };
    document.getElementById('filter-year').onclick = () => {
      currentPath = '/orders/year';
      loadAndRender(currentPath);
    };

    // — Búsqueda en la tabla
    searchIn.addEventListener('input', () => {
      const term = searchIn.value.trim().toLowerCase();
      Array.from(tbody.rows).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
      });
    });

    // — Carga inicial
    loadAndRender(currentPath);

    // --- Funciones ---

    // GET + render de órdenes
    async function loadAndRender(path) {
      try {
        const res = await fetch(baseUrl + path, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const { orders } = await res.json();
        renderTable(orders || []);
        searchIn.value = '';
      } catch {
        alert('No se pudieron obtener las órdenes.');
      }
    }

    // Renderiza filas en la tabla
    function renderTable(orders) {
      tbody.innerHTML = '';
      orders.forEach(o => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="p-3"><i class="fa-solid fa-box-open"></i></td>
          <td class="p-3">${o.id_user}</td>
          <td class="p-3">${new Date(o.date_order).toLocaleString()}</td>
          <td class="p-3">${o.condition}</td>
          <td class="p-3">${o.total}</td>
          <td class="p-3">${o.status}</td>
          <td class="p-3">
            <button class="btn-preview" data-id="${o.id_order}">
              <i class="fas fa-eye"></i>
            </button>
            ${o.status === 'active'
              ? `<button class="btn-delete" data-id="${o.id_order}">
                   <i class="fas fa-trash"></i>
                 </button>`
              : `<button class="btn-restore" data-id="${o.id_order}">
                   <i class="fas fa-undo-alt"></i>
                 </button>`
            }
          </td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('.btn-preview').forEach(b => b.onclick = () => openPreview(b.dataset.id));
      tbody.querySelectorAll('.btn-delete') .forEach(b => b.onclick = () => deleteOrder(b.dataset.id));
      tbody.querySelectorAll('.btn-restore').forEach(b => b.onclick = () => restoreOrder(b.dataset.id));
    }

    // Abre modal con detalles de la orden
    async function openPreview(id) {
      try {
        // 1) Orden
        const resO = await fetch(`${baseUrl}/orders/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resO.ok) throw new Error('Orden no encontrada');
        const { order } = await resO.json();

        // 2) Usuario
        const resU = await fetch(`${baseUrl}/users/${order.id_user}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resU.ok) throw new Error('Usuario no encontrado');
        const { user } = await resU.json();

        // 3) Productos
        const prodIds = [...new Set(order.order_details.map(d => d.id_product))];
        const prods   = await Promise.all(prodIds.map(pid =>
          fetch(`${baseUrl}/products/${pid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => {
            if (!r.ok) throw new Error(`Producto ${pid} no encontrado`);
            return r.json();
          })
        ));
        const prodMap = Object.fromEntries(prods.map(p => [p.id, p.name]));

        // Rellenar modal
        modalTitle.textContent = order.id_order;
        document.getElementById('modal-user-name')   .textContent = user.name;
        document.getElementById('modal-user-phone')  .textContent = user.phone;
        document.getElementById('modal-user-address').textContent = user.address;
        document.getElementById('modal-user-email')  .textContent = user.email;
        detBody.innerHTML = '';
        order.order_details.forEach(d => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${d.id_detail}</td>
            <td>${prodMap[d.id_product] || d.id_product}</td>
            <td>${d.amount}</td>
            <td>${d.unit_price}</td>
            <td>${d.subtotal}</td>`;
          detBody.appendChild(tr);
        });

        modalEl.show();

      } catch (err) {
        console.error(err);
        alert('Error cargando vista previa: ' + err.message);
      }
    }

    // Borrar (status -> deleted)
    async function deleteOrder(id) {
      if (!confirm('¿Eliminar esta orden?')) return;
      try {
        const res = await fetch(`${baseUrl}/orders/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        await loadAndRender(currentPath);
        showNotification('Pedido eliminado');
      } catch {
        alert('Error al eliminar.');
      }
    }

    // Restaurar (status -> active)
    async function restoreOrder(id) {
      if (!confirm('¿Restaurar esta orden?')) return;
      try {
        const res = await fetch(`${baseUrl}/orders/${id}/restore`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        await loadAndRender(currentPath);
        showNotification('Pedido restaurado');
      } catch {
        alert('Error al restaurar.');
      }
    }

    // Mostrar notificaciones
    function showNotification(message) {
      const n = document.createElement('div');
      n.className = 'notification';
      n.textContent = message;
      n.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: #000; color: #fff;
        padding: 1rem 1.5rem; border-radius: 4px;
        z-index: 9999; font-size: .9rem; font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%); transition: transform .3s ease;
      `;
      document.body.appendChild(n);
      setTimeout(() => n.style.transform = 'translateX(0)', 100);
      setTimeout(() => {
        n.style.transform = 'translateX(100%)';
        setTimeout(() => document.body.removeChild(n), 300);
      }, 3000);
    }

    // Toggle navbar (opcional)
    const toggler     = document.querySelector('.navbar-toggler');
    const togglerIcon = document.getElementById('navTogglerIcon');
    if (toggler && togglerIcon) {
      toggler.addEventListener('click', () => {
        togglerIcon.classList.toggle('fa-bars');
        togglerIcon.classList.toggle('fa-times');
      });
    }
  });
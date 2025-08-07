const base_url = `${CONFIG.API_URL}`;

let currentOrders = [];
let selectedOrderId = null;

window.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  //const name = localStorage.getItem('name');

  if (!token || role !== 'usuario') {
    localStorage.clear();
    return window.location.href = '/login';
  }

  //showNotification(`¡Bienvenido, ${name}!`);

  try {
    const res = await fetch(`${base_url}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.orders || data.orders.length === 0) {
      document.getElementById('ordersList').innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-shopping-bag fa-3x text-muted mb-3"></i>
          <h5 class="text-muted">No tienes pedidos aún</h5>
          <p class="text-muted">Cuando realices tu primera compra, aparecerá aquí</p>
        </div>
      `;
      return;
    }

    currentOrders = data.orders;
    updateOrdersCount(data.orders.length);
    renderOrders(data.orders);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    document.getElementById('ordersList').innerHTML = `
      <div class="text-center py-5">
        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
        <h5 class="text-danger">Error al cargar los pedidos</h5>
        <p class="text-muted">Por favor, intenta recargar la página</p>
      </div>
    `;
  }
});

//contador de historial de compras
function updateOrdersCount(count) {
  const subtitle = document.getElementById('ordersCount');
  if (subtitle) {
    subtitle.textContent = `Historial de tus compras (${count} pedidos)`;
  }
}

// Card de pedidos
async function renderOrders(orders) {
  const container = document.getElementById('ordersList');
  container.innerHTML = '';

  for (const order of orders) {
    // pedimos el texto correcto de cantidad
    const countText = await getProductCountText(order.id_order);

    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    orderCard.setAttribute('data-order-id', order.id_order);
    orderCard.innerHTML = `
      <div class="order-header">
        <h4 class="order-number">Pedido ${order.id_order}</h4>
        <span class="order-status ${getStatusClass(order.condition)}">
          ${getStatusText(order.condition)}
        </span>
      </div>
      <div class="order-info">
        <div class="order-date">
          <i class="fas fa-calendar-alt"></i>
          ${new Date(order.date_order).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric'
          })}
        </div>
        <div class="order-total">
          $${parseFloat(order.total).toFixed(2)}
        </div>
      </div>
      <div class="order-footer">
        <div class="product-count">
          ${countText}
        </div>
        <button class="view-detail-btn" onclick="viewOrderDetail(${order.id_order})">
          <i class="fas fa-eye"></i> Ver Detalle
        </button>
      </div>
    `;
    container.appendChild(orderCard);
  }
}

function getStatusClass(condition) {
  const statusMap = {
    'pendiente': 'status-pendiente',
    'enviado': 'status-enviado',
    'entregado': 'status-entregado',
    'cancelado': 'status-cancelado'
  };
  return statusMap[condition.toLowerCase()] || 'status-pendiente';
}

function getStatusText(condition) {
  const statusMap = {
    'pendiente': 'Pendiente',
    'enviado': 'Enviado',
    'entregado': 'Entregado',
    'cancelado': 'Cancelado'
  };
  return statusMap[condition.toLowerCase()] || condition;
}

// Prepara los detalles del producto
async function viewOrderDetail(orderId) {
  const token = localStorage.getItem('token');

  // Actualizar selección visual
  document.querySelectorAll('.order-card').forEach(card => {
    card.classList.remove('selected');
  });

  const selectedCard = document.querySelector(`[data-order-id="${orderId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
  }

  selectedOrderId = orderId;

  try {
    const detailContainer = document.getElementById('orderDetailContainer');
    detailContainer.innerHTML = `
      <div class="empty-detail">
        <div class="spinner-border text-dark" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <h5 class="text-muted mt-3">Cargando detalles del pedido...</h5>
      </div>
    `;

    // 1. Obtener pedido con detalles
    const res = await fetch(`${base_url}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { order } = await res.json();

    // 2. Obtener productos activos
    const activeRes = await fetch(`${base_url}/products`);
    const { products: activeProducts } = await activeRes.json();

    // 3. Obtener productos inactivos
    const inactiveRes = await fetch(`${base_url}/products/inactive/product`);
    const { products: inactiveProducts } = await inactiveRes.json();

    // 4. Unificar ambos en la misma variable `products`
    const products = [...activeProducts, ...inactiveProducts];

    // 5. Renderizar detalles (sin modificar esta línea)
    renderOrderDetail(order, products);

    showNotification("Producto Cargado");

  } catch (err) {
    console.error('Error al obtener detalle del pedido:', err);
    const detailContainer = document.getElementById('orderDetailContainer');
    detailContainer.innerHTML = `
      <div class="empty-detail">
        <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
        <h5 class="text-danger">Error al cargar los detalles</h5>
        <p class="text-muted">Por favor, intenta de nuevo</p>
      </div>
    `;
  }
}


function renderOrderDetail(order, products) {
  const container = document.getElementById('orderDetailContainer');
  const statusClass = getStatusClass(order.condition);
  const statusText = getStatusText(order.condition);
  
  container.innerHTML = `
    <div class="order-detail">
      <div class="detail-header">
        <div class="order-number d-flex align-content-center justify-content-between mb-2">
          Detalle del Pedido
        </div>
        
        <div class="detail-info">
          <div class="info-item">
            <span class="info-label">Fecha del Pedido:</span>
            <span class="info-value">${new Date(order.date_order).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}</span>
          </div>

          <div class="info-item">
            <span class="info-label">Estado:</span>
            <span class="order-status ${statusClass}">${statusText}</span>
          </div>

        </div>
      </div>
      
      <div class="products-section">
        <h5 class="order-number mb-3">Productos</h5>
        ${order.order_details.map(detail => {
          const prod = products.find(p => p.id_product === detail.id_product);
          return renderProductItem(detail, prod);
        }).join('')}
      </div>
      
      <div class="total-section">
        <div class="total-amount">Total: S/ ${parseFloat(order.total).toFixed(2)}</div>
      </div>
    </div>
  `;
}

function renderProductItem(detail, product) {
  const productName = product?.name ?? 'Producto desconocido';
  const productImage = product?.images_url ?? null;
  
  return `
    <div class="product-item">
      <div class="product-image">
        ${productImage ? 
          `<img src="${productImage}" alt="${productName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <i class="fas fa-image" style="display:none;"></i>` :
          `<i class="fas fa-image"></i>`
        }
      </div>
      
      <div class="product-details">
        <div class="product-name">${productName}</div>
        <div class="product-description">Cantidad: ${detail.amount} x S/ ${parseFloat(detail.unit_price).toFixed(2)}</div>
      </div>
      
      <div class="product-pricing">
        <div class="product-subtotal">S/ ${parseFloat(detail.subtotal).toFixed(2)}</div>
      </div>
    </div>
  `;
}

// 1) Ahora solo contamos order_details.length
async function getProductCountText(orderId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${base_url}/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const { order } = await res.json();
    const detalles = order.order_details || [];
    const count = detalles.length;
    return count === 1
      ? '1 producto'
      : `${count} productos`;
  } catch {
    return '0 productos';
  }
}

// Función para mostrar notificaciones
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.innerHTML = `<i class="fa-solid fa-arrow-down me-2"></i>${message}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #212529;
    color: #ffffff;
    padding: 1rem 1.5rem;
    border-radius: 8px;
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
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
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
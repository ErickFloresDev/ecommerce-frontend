function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const container = document.getElementById("cart-container");
  const summary = document.getElementById("cart-summary");
  const productsCount = document.getElementById("products-count");

  // Actualizar contador de productos
  if (productsCount) {
    productsCount.textContent = cart.length;
  }

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-shopping-cart"></i>
        <h3>El carrito está vacío</h3>
        <p>No hay productos en tu carrito</p>
      </div>
    `;

    summary.innerHTML = "";
    return;
  }

  let total = 0;

  // Crear tabla responsive
  container.innerHTML = `
    <div class="table-responsive">
      <table class="table align-middle">
        <thead class="table-white">
          <tr>
            <th scope="col">Imagen</th>
            <th scope="col">Producto</th>
            <th scope="col">Precio</th>
            <th scope="col">Cantidad</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody id="cart-tbody">
        </tbody>
      </table>
    </div>
  `;

  const tbody = document.getElementById("cart-tbody");

  cart.forEach(item => {
    const subtotal = item.price_end * item.quantity;
    total += subtotal;

    tbody.innerHTML += `
      <tr>
        <td>
          <img src="${item.images_url}" 
               alt="${item.name}" 
               class="product-image" />
        </td>
        <td>
          <div class="product-name">${item.name}<br> <span class="description-table">${item.description}</span></div>
        </td>
        <td>
          <div class="product-price">S/ ${item.price_end.toFixed(2)}</div>
        </td>
        <td>
          <div class="quantity-selector">
            <button class="quantity-btn" onclick="updateQuantity(${item.id_product}, -1)">
              <i class="fas fa-minus"></i>
            </button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="quantity-btn" onclick="updateQuantity(${item.id_product}, 1)">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </td>
        <td>
          <button class="remove-btn" onclick="removeFromCart(${item.id_product})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  summary.innerHTML = `
    <div class="summary-card">
      <h2 class="summary-title">Resumen del Pedido</h2>
      
      ${cart.map(item => `
        <div class="summary-row">
          <span class="summary-label">${item.name} x${item.quantity}</span>
          <span class="summary-value">S/ ${(item.price_end * item.quantity).toFixed(2)}</span>
        </div>
      `).join('')}
      
      <div class="summary-row">
        <span class="summary-label">Subtotal</span>
        <span class="summary-value">S/ ${total.toFixed(2)}</span>
      </div>
      
      <div class="summary-row">
        <span class="summary-label">Envío</span>
        <span class="summary-value">Gratis</span>
      </div>

      <div class="summary-row">
        <span class="summary-label">Total</span>
        <span class="summary-value">S/ ${total.toFixed(2)}</span>
      </div>
      
      <button class="btn-dark-final mt-3" onclick="finalizePurchase()">
        Finalizar Compra
      </button>
      
      <a href="/home" class="btn btn-outline-dark-buy mt-3">
          <i class="fas fa-arrow-left me-2"></i>
          Continuar Comprando
      </a>
    </div>
  `;
}

function updateQuantity(id_product, change) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find(p => p.id_product === id_product);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      showNotification('¿Desea eliminar el producto?');
    } else {
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    }
  }
}

function removeFromCart(id_product) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter(p => p.id_product !== id_product);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  showNotification('Producto eliminado');
}

function clearCart() {
  localStorage.removeItem("cart");
  renderCart();
  showNotification('Carrito Vacío');
}

function finalizePurchase() {
  showNotification('Debe de Iniciar sesion para continuar');
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

window.onload = renderCart;